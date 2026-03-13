const mongoose = require("mongoose");
const { INVITATION_STATUS } = require("../constants/enums");

const projectInvitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    proposedRole: {
      type: String,
      default: "member"
    },
    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING
    },
    respondedAt: Date
  },
  {
    timestamps: true
  }
);

projectInvitationSchema.index({ project: 1, invitedUser: 1 }, { unique: true });

module.exports =
  mongoose.models.ProjectInvitation ||
  mongoose.model("ProjectInvitation", projectInvitationSchema);
