const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    media: {
      type: Object,
      default: {
        fileId: "",
        url: "",
        fileType: "",
      },
      required: [true, "Media is required "],
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("status", statusSchema);
