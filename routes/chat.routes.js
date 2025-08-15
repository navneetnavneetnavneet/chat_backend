const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authUser = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller");

// POST /api/chats
router.post(
  "/",
  [body("userId").isMongoId().withMessage("Invalid userId !")],
  authUser.isAuthenticated,
  chatController.accessChat
);

// GET /api/chats
router.get("/", authUser.isAuthenticated, chatController.fetchAllChat);

// POST /api/chats/create-group
router.post(
  "/create-group",
  [
    body("chatName").notEmpty().withMessage("chatName is required !"),
    body("users")
      .isJSON()
      .isLength({ min: 2 })
      .withMessage("More than 2 users are required in group chat !"),
  ],
  authUser.isAuthenticated,
  chatController.createGroupChat
);

// POST /api/chats/rename-group
router.post(
  "/rename-group",
  [
    body("chatId").isMongoId().withMessage("Invalid chatId !"),
    body("chatName").notEmpty().withMessage("chatName is required !"),
  ],
  authUser.isAuthenticated,
  chatController.renameGroupChat
);

// POST /api/chats/add-user-group
router.post(
  "/add-user-group",
  [
    body("chatId").isMongoId().withMessage("Invalid chatId !"),
    body("userId").isMongoId().withMessage("Invalid userId !"),
  ],
  authUser.isAuthenticated,
  chatController.addUserToGroup
);

// POST /api/chats/remove-user-group
router.post(
  "/remove-user-group",
  [
    body("chatId").isMongoId().withMessage("Invalid chatId !"),
    body("userId").isMongoId().withMessage("Invalid userId !"),
  ],
  authUser.isAuthenticated,
  chatController.removeUserFromGroup
);

// POST /api/chats/exit-user-group
router.post(
  "/exit-user-group",
  [body("chatId").isMongoId().withMessage("Invalid chatId !")],
  authUser.isAuthenticated,
  chatController.exitUserFromGroup
);

module.exports = router;
