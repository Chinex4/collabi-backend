const { body, param, query } = require("express-validator");

const objectIdParam = (field = "id") =>
  param(field).isMongoId().withMessage(`${field} must be a valid MongoDB ObjectId`);

const paginationValidators = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
];

const requiredString = (field, label = field) =>
  body(field).trim().notEmpty().withMessage(`${label} is required`);

module.exports = {
  objectIdParam,
  paginationValidators,
  requiredString
};
