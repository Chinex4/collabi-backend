const mongoose = require("mongoose");
const { PROJECT_STATUS, PROJECT_VISIBILITY } = require("../constants/enums");

const attachmentSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FileResource"
    },
    label: String
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    },
    requiredSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill"
      }
    ],
    optionalSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill"
      }
    ],
    maxTeamSize: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    currentTeamSize: {
      type: Number,
      default: 1
    },
    deadline: Date,
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.OPEN
    },
    visibility: {
      type: String,
      enum: Object.values(PROJECT_VISIBILITY),
      default: PROJECT_VISIBILITY.PUBLIC
    },
    tags: [String],
    attachments: [attachmentSchema],
    recruitmentOpen: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ status: 1, category: 1, deadline: 1 });
projectSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);
