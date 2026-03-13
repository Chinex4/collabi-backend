const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/token");

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : req.cookies.accessToken;

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-password -refreshToken");

    if (!user || !user.isActive || user.isDeleted) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "User account is not available"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "You are not allowed to access this resource"));
  }

  next();
};

module.exports = {
  protect,
  authorize
};
