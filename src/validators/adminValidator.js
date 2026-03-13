const { body } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const userFlagValidator = [
  objectIdParam("id"),
  body("reason").optional().isString()
];

const resetUserPasswordValidator = [
  objectIdParam("id"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters long")
];

const projectStatusAdminValidator = [
  objectIdParam("id"),
  body("status").isIn(["open", "in_progress", "completed", "cancelled", "closed"])
];

const settingValidator = [
  body("key").trim().notEmpty().withMessage("key is required"),
  body("value").notEmpty().withMessage("value is required"),
  body("description").optional().isString(),
  body("isPublic").optional().isBoolean()
];

const announcementValidator = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("message").trim().notEmpty().withMessage("message is required")
];

const moderationActionValidator = [
  objectIdParam("id"),
  body("action")
    .isIn(["suspend_user", "remove_project", "remove_message"])
    .withMessage("action is invalid"),
  body("resolutionNote").optional().isString()
];

module.exports = {
  userFlagValidator,
  resetUserPasswordValidator,
  projectStatusAdminValidator,
  settingValidator,
  announcementValidator,
  moderationActionValidator,
  idParamValidator: [objectIdParam("id")],
  paginationValidators
};
