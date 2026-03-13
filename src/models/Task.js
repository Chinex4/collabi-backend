const mongoose = require("mongoose");
const { TASK_STATUS, TASK_PRIORITY } = require("../constants/enums");

const taskActivitySchema = new mongoose.Schema(
  {
    action: String,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM
    },
    dueDate: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FileResource"
      }
    ],
    activityLog: [taskActivitySchema],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ project: 1, status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
