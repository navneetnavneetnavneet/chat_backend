const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required !"],
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      expires: 86400,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("blacklistToken", blacklistTokenSchema);
