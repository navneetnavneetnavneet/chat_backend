const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required !"],
      trim: true,
      minLength: [3, "Full name must be atleast 3 characters !"],
    },
    email: {
      type: String,
      required: [true, "Email is required !"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required !"],
      select: false,
      trim: true,
      minLength: [6, "Password must be atleast 6 characters !"],
      maxLength: [
        15,
        "Password should not be exceed more than 15 characters !",
      ],
    },
    gender: {
      type: String,
      required: [true, "Gender is required !"],
      enum: ["male", "female", "other"],
    },
    dateOfBirth: {
      // type: Date,
      type: String,
      required: [true, "Date of birth is required !"],
    },
    profileImage: {
      type: Object,
      default: {
        fileId: "",
        url: "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg",
        fileType: "image",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      minLength: [6, "OTP must be have 6 characters !"],
    },
    otpExpiration: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpire: {
      type: Date,
    },
    status: [{ type: mongoose.Schema.Types.ObjectId, ref: "status" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("user", userSchema);
