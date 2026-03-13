const sendSuccess = (
  res,
  { statusCode = 200, message = "Request successful", data = null, meta = null }
) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });

const sendError = (res, { statusCode = 500, message = "Something went wrong", errors = [] }) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });

module.exports = {
  sendSuccess,
  sendError
};
