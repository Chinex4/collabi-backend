const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES } = require("../constants/enums");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },
    level: {
      type: Number,
      min: 100,
      max: 800
    },
    profileImage: {
      url: String,
      publicId: String
    },
    refreshToken: {
      type: String,
      select: false
    },
    emailVerificationOtp: String,
    emailVerificationOtpExpires: Date,
    passwordResetOtp: String,
    passwordResetExpires: Date,
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    suspensionReason: String,
    lastLoginAt: Date,
    lastSeen: Date,
    savedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
