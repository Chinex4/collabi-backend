const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const authService = require("../services/authService");
const { USER_ROLES } = require("../constants/enums");

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken");
};

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerStudent(req.body);
  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, {
    statusCode: 201,
    message: "Registration successful",
    data: result
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, {
    message: "Login successful",
    data: result
  });
});

const adminLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginUser({
    ...req.body,
    expectedRole: USER_ROLES.ADMIN
  });
  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, {
    message: "Admin login successful",
    data: result
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const result = await authService.refreshUserToken(refreshToken);
  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, {
    message: "Token refreshed successfully",
    data: result
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id);
  clearAuthCookies(res);

  sendSuccess(res, {
    message: "Logged out successfully"
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  sendSuccess(res, {
    message: "If the email exists, a password reset link has been sent"
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await authService.resetPassword(req.body);

  sendSuccess(res, {
    message: "Password reset successful",
    data: user
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body.token);

  sendSuccess(res, {
    message: "Email verified successfully",
    data: user
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword
  });

  sendSuccess(res, {
    message: "Password changed successfully",
    data: user
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  sendSuccess(res, {
    message: "Authenticated user fetched successfully",
    data: user
  });
});

const deactivate = asyncHandler(async (req, res) => {
  const user = await authService.deactivateAccount(req.user._id);

  sendSuccess(res, {
    message: "Account deactivated successfully",
    data: user
  });
});

const deleteOwnAccount = asyncHandler(async (req, res) => {
  const user = await authService.deleteOwnAccount(req.user._id);
  clearAuthCookies(res);

  sendSuccess(res, {
    message: "Account deleted successfully",
    data: user
  });
});

module.exports = {
  register,
  login,
  adminLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  me,
  deactivate,
  deleteOwnAccount
};
