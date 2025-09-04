const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    media: {
      type: Object,
      default: {
        fileId: "",
        url: "",
        fileType: "",
      },
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "chat" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("message", messageSchema);
