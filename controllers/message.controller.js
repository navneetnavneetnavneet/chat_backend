const {
  catchAsyncError,
} = require("../middlewares/catchAsyncError.middleware");
const ErrorHandler = require("../utils/ErrorHandler");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const messageModel = require("../models/message.model");
const chatModel = require("../models/chat.model");
const userModel = require("../models/user.model");
const imagekit = require("../config/imagekit.config").initImagekit();

module.exports.sendMessage = catchAsyncError(async (req, res, next) => {
  const { chatId, content, media } = req.body;

  if (!chatId || (!content && media)) {
    return next(new ErrorHandler("All fileds are required !", 400));
  }

  let fileId, url, mimeType;
  if (req.files && req.files.media) {
    const file = req.files.media;
    const modifiedFileName = uuidv4() + path.extname(file.name);
    mimeType = file.mimetype.split("/")[0];

    const validMimeTypes = [
      // images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",

      // videos
      "video/mp4",
      "video/webm",
      "video/ogg",

      // text
      "text/plain",
      "application/json",
      "application/pdf",
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      return next(
        new ErrorHandler("Invalid file type. Please choose another file !", 500)
      );
    }

    const maxSize = 20 * 1024 * 1024; // 20MB

    if (file.size > maxSize) {
      return next(
        new ErrorHandler(
          "File size exceeds the 20MB limit, Please choose another file !",
          500
        )
      );
    }

    try {
      const uploadedResponse = await imagekit.upload({
        file: file.data,
        fileName: modifiedFileName,
      });

      fileId = uploadedResponse.fileId;
      url = uploadedResponse.url;
    } catch (error) {
      return next(new ErrorHandler("File is not uploaded on imagekit !", 500));
    }
  }

  try {
    let message = await messageModel.create({
      content: content,
      media: { fileId, url, fileType: mimeType },
      senderId: req._id,
      chatId: chatId,
    });

    message = await message.populate("senderId");
    message = await message.populate("chatId");
    message = await userModel.populate(message, {
      path: "chatId.users",
    });

    await chatModel.findByIdAndUpdate(
      chatId,
      { latestMessage: message },
      { new: true }
    );

    res.status(201).json(message);
  } catch (error) {
    return next(new ErrorHandler("Message is not created !", 500));
  }
});

module.exports.fetchAllMesssages = catchAsyncError(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    return next(new ErrorHandler("chatId params not sent by request !", 400));
  }

  const messages = await messageModel
    .find({ chatId })
    .populate("senderId")
    .populate("chatId");

  res.status(200).json(messages);
});
