const { StatusCodes } = require("http-status-codes");
const { sendError } = require("../utils/response");

const notFound = (req, res) => {
  sendError(res, {
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route not found: ${req.originalUrl}`,
    errors: []
  });
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  if (error.name === "ValidationError") {
    return sendError(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Validation error",
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.name === "CastError") {
    return sendError(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Invalid resource identifier",
      errors: [error.path]
    });
  }

  if (error.code === 11000) {
    return sendError(res, {
      statusCode: StatusCodes.CONFLICT,
      message: "Duplicate value found",
      errors: Object.keys(error.keyPattern || {})
    });
  }

  return sendError(res, {
    statusCode,
    message: error.message || "Internal server error",
    errors: error.errors || []
  });
};

module.exports = {
  notFound,
  errorHandler
};
