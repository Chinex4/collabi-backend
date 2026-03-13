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

  const verificationToken = crypto.randomBytes(24).toString("hex");

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
    role: USER_ROLES.STUDENT,
    emailVerificationToken: verificationToken
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
        verificationLink: `${
          process.env.FRONTEND_VERIFY_EMAIL_URL || process.env.CLIENT_URL
        }?token=${verificationToken}`
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

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: passwordResetTemplate({
        name: user.fullName,
        resetLink: `${process.env.FRONTEND_RESET_PASSWORD_URL}?token=${resetToken}`
      })
    });
  } catch (error) {
    console.error("Password reset send failed:", error.message);
  }
};

const resetPassword = async ({ token, password }) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  }).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset token is invalid or expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sanitizeUser(user);
};

const verifyEmail = async (token) => {
  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Verification token is invalid");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  return sanitizeUser(user);
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
  changePassword,
  deactivateAccount,
  deleteOwnAccount,
  getCurrentUser
};
