const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new ApiError(
      StatusCodes.BAD_REQUEST,
      "Validation failed",
      errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    )
  );
};

module.exports = validate;
