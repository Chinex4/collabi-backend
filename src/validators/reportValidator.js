const { body } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const createReportValidator = [
  body("targetType").isIn(["user", "project", "message"]).withMessage("targetType is invalid"),
  body("targetId").isMongoId().withMessage("targetId is required"),
  body("reason").trim().notEmpty().withMessage("reason is required"),
  body("description").optional().isString()
];

const reviewReportValidator = [
  objectIdParam("id"),
  body("resolutionNote").optional().isString()
];

module.exports = {
  createReportValidator,
  reviewReportValidator,
  reportIdValidator: [objectIdParam("id")],
  listReportsValidator: paginationValidators
};
