const mongoose = require("mongoose");
const { APPLICATION_STATUS } = require("../constants/enums");

const projectApplicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date,
    reviewNote: String
  },
  {
    timestamps: true
  }
);

projectApplicationSchema.index({ project: 1, applicant: 1 }, { unique: true });
projectApplicationSchema.index({ applicant: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.ProjectApplication ||
  mongoose.model("ProjectApplication", projectApplicationSchema);
