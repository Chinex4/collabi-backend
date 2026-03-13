const mongoose = require("mongoose");
const { CONVERSATION_TYPE } = require("../constants/enums");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CONVERSATION_TYPE),
      required: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ type: 1, project: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
