const mongoose = require("mongoose");

const fileResourceSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    contextType: {
      type: String,
      enum: ["profile", "project", "task", "chat", "general"],
      default: "general"
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId
    },
    originalName: String,
    folder: String,
    url: {
      type: String,
      required: true
    },
    publicId: String,
    mimeType: String,
    size: Number,
    resourceType: String
  },
  {
    timestamps: true
  }
);

fileResourceSchema.index({ uploader: 1, contextType: 1, createdAt: -1 });

module.exports = mongoose.models.FileResource || mongoose.model("FileResource", fileResourceSchema);
