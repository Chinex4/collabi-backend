const { body } = require("express-validator");

const registerValidator = [
  body("fullName").trim().notEmpty().withMessage("fullName is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("department").optional().isMongoId().withMessage("department must be a valid id"),
  body("faculty").optional().isMongoId().withMessage("faculty must be a valid id"),
  body("level").isInt({ min: 100, max: 800 }).withMessage("level must be between 100 and 800")
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("password is required")
];

const forgotPasswordValidator = [body("email").isEmail().withMessage("A valid email is required")];

const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
];

const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
};
