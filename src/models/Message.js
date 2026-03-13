const mongoose = require("mongoose");
const { MESSAGE_TYPE } = require("../constants/enums");

const messageReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      trim: true,
      default: ""
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      default: MESSAGE_TYPE.TEXT
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FileResource"
      }
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    deliveredTo: [messageReceiptSchema],
    readBy: [messageReceiptSchema],
    isEdited: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ content: "text" });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
