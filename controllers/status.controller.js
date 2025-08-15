const {
  catchAsyncError,
} = require("../middlewares/catchAsyncError.middleware");
const ErrorHandler = require("../utils/ErrorHandler");
const statusModel = require("../models/status.model");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const userModel = require("../models/user.model");
const imagekit = require("../config/imagekit.config").initImagekit();

module.exports.uploadStatus = catchAsyncError(async (req, res, next) => {
  if (req.files && req.files.media) {
    const file = req.files.media;
    const modifiedFileName = uuidv4() + path.extname(file.name);
    const mimeType = file.mimetype.split("/")[0];

    const validMimeTypes = [
      // Image MIME types
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/avif",

      // Video MIME types
      "video/mp4",
      "video/x-msvideo",
      "video/mpeg",
      "video/ogg",
      "video/webm",
      "video/3gpp",
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      return next(
        new ErrorHandler("Invalid file type, Please choose another file !", 400)
      );
    }

    const maxSize = 20 * 1024 * 1024; // 20MB

    if (file.size > maxSize) {
      return next(
        new ErrorHandler(
          "File size exceeds the 20MB limit, Please choose another file !",
          400
        )
      );
    }

    try {
      const { fileId, url } = await imagekit.upload({
        file: file.data,
        fileName: modifiedFileName,
      });

      const status = await statusModel.create({
        media: { fileId, url, fileType: mimeType },
        user: req._id,
      });

      const user = await userModel.findById(req._id);

      if (!user) {
        return next(new ErrorHandler("User not found !"));
      }

      user.status.push(status._id);
      await user.save();

      res.status(201).json({
        message: "Status Uploaded successfully",
        user,
      });
    } catch (error) {
      return next(new ErrorHandler("File is not uploaded on imagekit !", 500));
    }
  } else {
    return next(
      new ErrorHandler("File is must be required eigther image or video !", 400)
    );
  }
});

module.exports.fetchAllStatus = catchAsyncError(async (req, res, next) => {
  const allStatus = await statusModel.find().populate({
    path: "user",
    populate: {
      path: "status",
    },
  });

  const obj = {};
  const filteredStatus = allStatus.filter((s) => {
    if (!obj[s.user._id]) {
      return (obj[s.user._id] = "anything");
    }
  });

  const loggedInUserStatus = filteredStatus.find(
    (s) => s.user._id.toString() === req._id.toString()
  );

  const otherUserStatus = filteredStatus.filter(
    (s) => s.user._id.toString() !== req._id.toString()
  );

  if (loggedInUserStatus) {
    otherUserStatus.unshift(loggedInUserStatus);
  }

  res.status(200).json(otherUserStatus);
});

module.exports.deleteStatus = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req._id);

  if (!user.status.includes(req.params.statusId.toString())) {
    return next(new ErrorHandler("status is not found !", 404));
  }

  user.status.splice(user.status.indexOf(req.params.statusId.toString()), 1);
  await statusModel.findByIdAndDelete(req.params.statusId.toString(), {
    new: true,
  });

  await user.save();

  res.status(200).json({
    message: "Status Delete Successfully",
    user,
  });
});
