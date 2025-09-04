const {
  catchAsyncError,
} = require("../middlewares/catchAsyncError.middleware");
const chatModel = require("../models/chat.model");
const userModel = require("../models/user.model");
const ErrorHandler = require("../utils/ErrorHandler");
const { validationResult } = require("express-validator");

module.exports.accessChat = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.body;

  let isChat = await chatModel
    .find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
    .populate("users")
    .populate("latestMessage");

  isChat = await userModel.populate(isChat, {
    path: "latestMessage.senderId",
  });

  if (isChat.length > 0) {
    res.status(200).json(isChat[0]);
  } else {
    try {
      const createdChat = await chatModel.create({
        isGroupChat: false,
        users: [req._id, userId],
      });

      const fullChat = await chatModel
        .findById(createdChat._id)
        .populate("users");

      res.status(201).json(fullChat);
    } catch (error) {
      return next(new ErrorHandler("Chat is not created !", 500));
    }
  }
});

module.exports.fetchAllChat = catchAsyncError(async (req, res, next) => {
  await chatModel
    .find({ users: { $elemMatch: { $eq: req._id } } })
    .populate("users")
    .populate("groupAdmin")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      // Adding the admin to the start of the chat.users array
      results.forEach((chat, index) => {
        if (chat.isGroupChat && chat.groupAdmin) {
          const adminIndex = chat.users.findIndex(
            (u) => u._id.toString() === chat.groupAdmin._id.toString()
          );

          const [adminUser] = chat.users.splice(adminIndex, 1);
          chat.users.unshift(adminUser);
        }

        // Adding the loggedInUser to the start of the chat.users array
        const loggedInUserIndex = chat.users.findIndex(
          (u) => u._id.toString() === req._id.toString()
        );

        const [loggedInUser] = chat.users.splice(loggedInUserIndex, 1);
        chat.users.unshift(loggedInUser);
      });

      results = await userModel.populate(results, {
        path: "latestMessage.senderId",
      });

      res.status(200).json(results);
    });
});

module.exports.createGroupChat = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const users = JSON.parse(req.body.users);
  users.unshift(req._id);

  if (users.length <= 2) {
    return next(
      new ErrorHandler("More than 2 users are required in group chat !", 400)
    );
  }

  const isGroup = await chatModel.findOne({ chatName: req.body.chatName });

  if (isGroup) {
    return next(
      new ErrorHandler("Group is already existed with these chatName !", 400)
    );
  }

  try {
    const createdGroup = await chatModel.create({
      chatName: req.body.chatName,
      isGroupChat: true,
      users: users,
      groupAdmin: req._id,
      groupImage: {
        fileId: "",
        url: "https://png.pngtree.com/png-clipart/20230915/original/pngtree-linear-group-icon-for-customer-service-icon-white-manager-vector-png-image_12180690.png",
        fileType: "image",
      },
    });

    const fullGroupChat = await chatModel
      .findById(createdGroup._id)
      .populate("users")
      .populate("groupAdmin");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    return next(new ErrorHandler("Group chat is not created !", 500));
  }
});

module.exports.renameGroupChat = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { chatId, chatName } = req.body;

  try {
    const updatedGroupChat = await chatModel
      .findByIdAndUpdate(chatId, { chatName }, { new: true })
      .populate("users")
      .populate("groupAdmin");

    res.status(200).json(updatedGroupChat);
  } catch (error) {
    return next(new ErrorHandler("Group chatName is not updated !", 500));
  }
});

module.exports.addUserToGroup = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { chatId, userId } = req.body;

  try {
    const addedUser = await chatModel
      .findByIdAndUpdate(chatId, { $push: { users: userId } }, { new: true })
      .populate("users")
      .populate("groupAdmin");

    res.status(200).json(addedUser);
  } catch (error) {
    return next(new ErrorHandler("User is not added in group chat !", 500));
  }
});

module.exports.removeUserFromGroup = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { chatId, userId } = req.body;

  try {
    const removedUser = await chatModel
      .findByIdAndUpdate(chatId, { $pull: { users: userId } }, { new: true })
      .populate("users")
      .populate("groupAdmin");

    res.status(200).json(removedUser);
  } catch (error) {
    return next(new ErrorHandler("User is not removed from group chat !", 500));
  }
});

module.exports.exitUserFromGroup = catchAsyncError(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { chatId } = req.body;

  const chat = await chatModel
    .findById(chatId)
    .populate("users")
    .populate("groupAdmin");

  if (!chat) {
    return next(new ErrorHandler("Chat is not found !", 404));
  }

  chat.users = chat.users.filter((u) => u._id.toString() !== req._id.toString());

  if (chat.groupAdmin._id.toString() === req._id.toString()) {
    chat.groupAdmin = chat.users[0] || null;
  }

  await chat.save();

  res.status(200).json(chat);
});
