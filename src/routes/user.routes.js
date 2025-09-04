const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/user.controller");
const authUser = require("../middlewares/auth.middleware");

// POST /api/users/send-otp
router.post(
  "/send-otp",
  [body("email").isEmail().withMessage("Invalid email !")],
  userController.sendOTP
);

// POST /api/users/signup
router.post(
  "/signup",
  [
    body("fullName")
      .isLength({ min: 3 })
      .withMessage("fullName must be atleast 3 characters !"),
    body("email").isEmail().withMessage("Invalid email !"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be atleast 6 characters !"),
    body("password")
      .isLength({ max: 15 })
      .withMessage("Password should not be exceed more than 15 characters !"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender eigther be only (male, female or other)"),
    body("dateOfBirth").notEmpty().withMessage("Date of Birth is required !"),
    body("otp")
      .isLength({ min: 6 })
      .withMessage("OTP must be have 6 characters !"),
  ],
  userController.signUpUser
);

// POST /api/users/signin
router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Invalid email !"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be atleast 6 characters !"),
    body("password")
      .isLength({ max: 15 })
      .withMessage("Password should not be exceed more than 15 characters !"),
  ],
  userController.signInUser
);

// GET /api/users/signout
router.get("/signout", authUser.isAuthenticated, userController.signOutUser);

// POST /api/users/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Invalid email !")],
  userController.forgotPassword
);

// POST /api/users/reset-password/:resetToken
router.post(
  "/reset-password/:resetToken",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be atleast 6 characters !"),
    body("password")
      .isLength({ max: 15 })
      .withMessage("Password should not be exceed more than 15 characters !"),
  ],
  userController.resetPassword
);

// GET /api/users/current
router.get("/current", authUser.isAuthenticated, userController.isLoggedInUser);

// GET /api/users/alluser
router.get("/alluser", authUser.isAuthenticated, userController.allUser);

// GET /api/users/
router.get("/", authUser.isAuthenticated, userController.fetchAllUser)

// POST /api/users/edit
router.post(
  "/edit",
  [
    body("fullName")
      .isLength({ min: 3 })
      .withMessage("fullName must be atleast 3 characters !"),
    body("email").isEmail().withMessage("Invalid email !"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender eigther be only (male, female or other)"),
    body("dateOfBirth").notEmpty().withMessage("Date of Birth is required !"),
  ],
  authUser.isAuthenticated,
  userController.editUser
);

// GET /api/users/delete
router.get("/delete", authUser.isAuthenticated, userController.deleteUser);

module.exports = router;
