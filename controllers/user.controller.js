const {
  catchAsyncError,
} = require("../middlewares/catchAsyncError.middleware");
const userModel = require("../models/user.model");
const blacklistTokenModel = require("../models/blacklistToken.model");
const ErrorHandler = require("../utils/ErrorHandler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/SendEmail");
const { sendToken } = require("../utils/SendToken");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const imagekit = require("../config/imagekit.config").initImagekit();
const crypto = require("crypto");

module.exports.sendOTP = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (user?.isVerified) {
    return next(new ErrorHandler("User already existed, Please login !", 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(otp, salt);

  await userModel.updateOne(
    { email },
    { otp: hashedOTP, otpExpiration: otpExpirationTime },
    { upsert: true }
  );

  try {
    sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);
    res.status(200).json({
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    return next(new ErrorHandler("Email sending error !", 500));
  }
});

module.exports.signUpUser = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password, gender, dateOfBirth, otp } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found !", 404));
  }

  if (user.isVerified) {
    return next(
      new ErrorHandler(
        "User already existed or registered, Please login !",
        400
      )
    );
  }

  const isValid = await bcrypt.compare(otp, user.otp);

  if (!isValid || user.otpExpiration < new Date()) {
    return next(new ErrorHandler("Invalid or expired OTP !", 400));
  }

  user.fullName = fullName;
  user.password = password;
  user.gender = gender;
  user.dateOfBirth = dateOfBirth;
  user.isVerified = true;
  user.otp = null;
  user.otpExpiration = null;

  await user.save();

  sendToken(201, res, user);
});

module.exports.signInUser = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password !", 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password !", 401));
  }

  sendToken(200, res, user);
});

module.exports.signOutUser = catchAsyncError(async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  await blacklistTokenModel.create({ token });
  await await res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "User Logout Successfully",
  });
});

module.exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found !", 404));
  }

  // grnerate token ans hash it
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpire = Date.now() + 10 * 60 * 1000; // 10 munutes

  await user.save();

  const resetLink = `${req.protocol}://${req.get(
    "host"
  )}/api/users/forgot-password-link/${resetToken}`;

  try {
    await sendEmail(
      email,
      "Password Recovery",
      `To reset your password, please click on this link: ${resetLink}`
    );

    res.status(200).json({
      message: "Reset password link sent to your email",
      resetToken,
      resetLink,
    });
  } catch (error) {
    return next(new ErrorHandler("Email sending error !", 500));
  }
});

module.exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;
  const { resetToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await userModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid or expired token !", 401));
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpire = null;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
    user,
  });
});

module.exports.isLoggedInUser = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req._id);

  res.status(200).json(user);
});

module.exports.allUser = catchAsyncError(async (req, res, next) => {
  const keyword = req.query.search
    ? {
        $or: [
          { fullName: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await userModel.find(keyword).find({ _id: { $ne: req._id } });

  res.status(200).json(users);
});

module.exports.fetchAllUser = catchAsyncError(async (req, res, next) => {
  const users = await userModel.find().populate("status");

  res.status(200).json(users);
});

module.exports.editUser = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, gender, dateOfBirth } = req.body;

  const user = await userModel.findByIdAndUpdate(
    req._id,
    { fullName, email, gender, dateOfBirth },
    { new: true }
  );

  if (req.files && req.files.profileImage) {
    const file = req.files.profileImage;
    const modifiedFileName = uuidv4() + path.extname(file.name);
    const mimeType = file.mimetype.split("/")[0];

    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      return next(
        new ErrorHandler(
          "Invalid file type. Only JPEG, PNG, JPG and WEBP files are allowed.",
          400
        )
      );
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return next(
        new ErrorHandler(
          "File size exceeds the 2MB limit, Please select another file !",
          400
        )
      );
    }

    try {
      if (user.profileImage && user.profileImage.fileId) {
        await imagekit.deleteFile(user.profileImage.fileId);
      }

      const { fileId, url } = await imagekit.upload({
        file: file.data,
        fileName: modifiedFileName,
      });

      user.profileImage = { fileId, url, fileType: mimeType };
    } catch (error) {
      return next(new ErrorHandler("File is not uploaded on imagekit !", 500));
    }
  }

  await user.save();

  res.status(200).json(user);
});

module.exports.deleteUser = catchAsyncError(async (req, res, next) => {
  await userModel.findByIdAndDelete(req._id, { new: true });

  res.status(200).json({
    success: true,
    message: "User Delete Successfully",
  });
});
