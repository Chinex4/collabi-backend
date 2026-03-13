const mongoose = require("mongoose");

const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    editedAt: Date
  },
  {
    timestamps: true
  }
);

taskCommentSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.models.TaskComment || mongoose.model("TaskComment", taskCommentSchema);
