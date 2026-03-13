const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");

const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const { USER_ROLES } = require("../constants/enums");
const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/email");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/token");
const {
  emailVerificationTemplate,
  passwordResetTemplate
} = require("../templates/emailTemplates");

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  faculty: user.faculty,
  department: user.department,
  level: user.level,
  profileImage: user.profileImage,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  isSuspended: user.isSuspended,
  createdAt: user.createdAt
});

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const buildAuthPayload = async (user) => {
  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role
  });
  const refreshToken = generateRefreshToken({
    userId: user._id,
    role: user.role
  });

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  user.lastSeen = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

const registerStudent = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const verificationOtp = generateOtp();

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
    role: USER_ROLES.STUDENT,
    emailVerificationOtp: verificationOtp,
    emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
  });

  await StudentProfile.create({
    user: user._id,
    faculty: payload.faculty,
    department: payload.department,
    level: payload.level
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: emailVerificationTemplate({
        name: user.fullName,
        otp: verificationOtp
      })
    });
  } catch (error) {
    console.error("Email verification send failed:", error.message);
  }

  return buildAuthPayload(user);
};

const loginUser = async ({ email, password, expectedRole }) => {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new ApiError(StatusCodes.FORBIDDEN, "This account cannot access this route");
  }

  if (user.isSuspended) {
    throw new ApiError(StatusCodes.FORBIDDEN, "This account has been suspended");
  }

  if (user.role === USER_ROLES.STUDENT && !user.isEmailVerified) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Email not verified. Verify your account with the OTP sent to your email."
    );
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  return buildAuthPayload(user);
};

const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken || user.isDeleted || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  return buildAuthPayload(user);
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 }
  });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

  if (!user) return;

  const resetOtp = generateOtp();
  user.passwordResetOtp = resetOtp;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: passwordResetTemplate({
        name: user.fullName,
        otp: resetOtp
      })
    });
  } catch (error) {
    console.error("Password reset send failed:", error.message);
  }
};

const resetPassword = async ({ email, otp, password }) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    passwordResetOtp: otp,
    passwordResetExpires: { $gt: new Date() }
  }).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset OTP is invalid or expired");
  }

  user.password = password;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sanitizeUser(user);
};

const verifyEmail = async ({ email, otp }) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationOtp: otp,
    emailVerificationOtpExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Verification OTP is invalid or expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpires = undefined;
  await user.save();

  return sanitizeUser(user);
};

const resendVerificationOtp = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false
  });

  if (!user) {
    return;
  }

  if (user.isEmailVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is already verified");
  }

  const verificationOtp = generateOtp();
  user.emailVerificationOtp = verificationOtp;
  user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "Your email verification OTP",
      html: emailVerificationTemplate({
        name: user.fullName,
        otp: verificationOtp
      })
    });
  } catch (error) {
    console.error("Resend email verification OTP failed:", error.message);
  }
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const matches = await user.comparePassword(currentPassword);

  if (!matches) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return sanitizeUser(user);
};

const deactivateAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: { isActive: false }
    },
    { new: true }
  );

  return sanitizeUser(user);
};

const deleteOwnAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isDeleted: true,
        isActive: false
      },
      $unset: {
        refreshToken: 1
      }
    },
    { new: true }
  );

  return sanitizeUser(user);
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return sanitizeUser(user);
};

module.exports = {
  registerStudent,
  loginUser,
  refreshUserToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationOtp,
  changePassword,
  deactivateAccount,
  deleteOwnAccount,
  getCurrentUser
};
