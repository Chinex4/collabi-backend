const { body } = require("express-validator");

const fileUploadValidator = [
  body("contextType").optional().isIn(["profile", "project", "task", "chat", "general"]),
  body("contextId").optional().isMongoId()
];

module.exports = {
  fileUploadValidator
};
