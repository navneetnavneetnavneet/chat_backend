const express = require("express");
const router = express.Router();
const authUser = require("../middlewares/auth.middleware");
const statusController = require("../controllers/status.controller");

// POST /api/status/upload
router.post("/upload", authUser.isAuthenticated, statusController.uploadStatus);

// GET /api/status/
router.get("/", authUser.isAuthenticated, statusController.fetchAllStatus);

// GET /api/status/delete/:statusId
router.get(
  "/delete/:statusId",
  authUser.isAuthenticated,
  statusController.deleteStatus
);

module.exports = router;
