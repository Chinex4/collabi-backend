const mongoose = require("mongoose");
const { PROJECT_VISIBILITY } = require("../constants/enums");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
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
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    skills: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill"
        },
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "beginner"
        }
      }
    ],
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interest"
      }
    ],
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available"
    },
    academicInfo: {
      matricNumber: String,
      cgpa: Number
    },
    portfolioLinks: {
      github: String,
      linkedin: String,
      portfolio: String
    },
    projectPreferences: {
      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category"
        }
      ],
      preferredCommitment: String,
      projectType: String
    },
    preferredRoles: [String],
    pastProjectExperience: [
      {
        title: String,
        description: String,
        role: String,
        year: Number
      }
    ],
    visibility: {
      type: String,
      enum: Object.values(PROJECT_VISIBILITY),
      default: PROJECT_VISIBILITY.PUBLIC
    },
    profilePicture: {
      url: String,
      publicId: String
    },
    completedProjectsCount: {
      type: Number,
      default: 0
    },
    currentProjectsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

studentProfileSchema.index({ department: 1, availability: 1 });
studentProfileSchema.index({ bio: "text", preferredRoles: "text" });

module.exports =
  mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);
