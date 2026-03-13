const mongoose = require("mongoose");
const { MEMBERSHIP_STATUS } = require("../constants/enums");

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roleName: {
      type: String,
      default: "member"
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.ProjectMember || mongoose.model("ProjectMember", projectMemberSchema);
