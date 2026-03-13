const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const chatService = require("../services/chatService");

const getConversations = asyncHandler(async (req, res) => {
  const result = await chatService.getMyConversations(req.user._id, req.query);
  sendSuccess(res, {
    message: "Conversations fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const createOrFetchPrivateConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getOrCreatePrivateConversation(
    req.user._id,
    req.body.participantId
  );
  sendSuccess(res, {
    message: "Private conversation ready",
    data: conversation
  });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getConversationMessages(
    req.user._id,
    req.params.conversationId,
    req.query
  );
  sendSuccess(res, {
    message: "Conversation messages fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getProjectMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getProjectConversationMessages(
    req.user._id,
    req.params.projectId,
    req.query
  );
  sendSuccess(res, {
    message: "Project chat messages fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const sendPrivateMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendPrivateMessage({
    userId: req.user._id,
    recipientId: req.body.recipientId,
    content: req.body.content,
    attachments: req.body.attachments,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    statusCode: 201,
    message: "Private message sent successfully",
    data: result
  });
});

const sendProjectMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendProjectMessage({
    userId: req.user._id,
    projectId: req.body.projectId,
    content: req.body.content,
    attachments: req.body.attachments,
    mentions: req.body.mentions,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    statusCode: 201,
    message: "Project message sent successfully",
    data: result
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  await chatService.markMessagesAsRead({
    userId: req.user._id,
    conversationId: req.params.conversationId,
    messageIds: req.body.messageIds || []
  });
  sendSuccess(res, {
    message: "Messages marked as read"
  });
});

const editMessage = asyncHandler(async (req, res) => {
  const message = await chatService.editMessage({
    userId: req.user._id,
    messageId: req.params.messageId,
    content: req.body.content
  });
  sendSuccess(res, {
    message: "Message edited successfully",
    data: message
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await chatService.deleteMessage({
    userId: req.user._id,
    messageId: req.params.messageId
  });
  sendSuccess(res, {
    message: "Message deleted successfully",
    data: message
  });
});

module.exports = {
  getConversations,
  createOrFetchPrivateConversation,
  getConversationMessages,
  getProjectMessages,
  sendPrivateMessage,
  sendProjectMessage,
  markAsRead,
  editMessage,
  deleteMessage
};
