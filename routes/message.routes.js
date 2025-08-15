const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authUser = require("../middlewares/auth.middleware");
const messageController = require("../controllers/message.controller");

// POST /api/messages/send-message
router.post(
  "/send-message",
  authUser.isAuthenticated,
  messageController.sendMessage
);

// GET /api/messages/
router.get(
  "/:chatId",
  authUser.isAuthenticated,
  messageController.fetchAllMesssages
);

module.exports = router;
