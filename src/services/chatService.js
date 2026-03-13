const { StatusCodes } = require("http-status-codes");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { CONVERSATION_TYPE, NOTIFICATION_TYPE } = require("../constants/enums");
const { createNotification } = require("./notificationService");
const {
  ensureProjectMember,
  getOrCreateProjectConversation,
  getProjectOrThrow
} = require("./projectAccessService");

const conversationPopulate = [
  { path: "participants", select: "fullName email profileImage lastSeen" },
  { path: "project", select: "title owner status" },
  {
    path: "lastMessage",
    populate: { path: "sender", select: "fullName email profileImage" }
  }
];

const messagePopulate = [
  { path: "sender", select: "fullName email profileImage" },
  { path: "attachments" }
];

const getOrCreatePrivateConversation = async (userId, participantId) => {
  let conversation = await Conversation.findOne({
    type: CONVERSATION_TYPE.PRIVATE,
    participants: { $all: [userId, participantId], $size: 2 }
  }).populate(conversationPopulate);

  if (!conversation) {
    conversation = await Conversation.create({
      type: CONVERSATION_TYPE.PRIVATE,
      participants: [userId, participantId],
      createdBy: userId
    });
  }

  return Conversation.findById(conversation._id).populate(conversationPopulate);
};

const getMyConversations = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);

  const filters = {
    participants: userId
  };

  const [items, total] = await Promise.all([
    Conversation.find(filters)
      .populate(conversationPopulate)
      .sort("-updatedAt")
      .skip(skip)
      .limit(limit),
    Conversation.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getConversationById = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId).populate(conversationPopulate);

  if (!conversation || !conversation.participants.some((item) => String(item._id || item) === String(userId))) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Conversation not found");
  }

  return conversation;
};

const getConversationMessages = async (userId, conversationId, query = {}) => {
  await getConversationById(userId, conversationId);
  const { page, limit, skip } = buildPagination(query);
  const filters = { conversation: conversationId };

  if (query.search) {
    filters.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Message.find(filters)
      .populate(messagePopulate)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filters)
  ]);

  return {
    items: items.reverse(),
    meta: buildMeta({ page, limit, total })
  };
};

const getProjectConversationMessages = async (userId, projectId, query = {}) => {
  await ensureProjectMember(projectId, userId);
  const conversation = await getOrCreateProjectConversation(projectId, userId);
  return getConversationMessages(userId, conversation._id, query);
};

const saveMessage = async ({ conversationId, sender, projectId, content, attachments = [], mentions = [] }) => {
  const message = await Message.create({
    conversation: conversationId,
    sender,
    project: projectId,
    content,
    attachments,
    mentions,
    deliveredTo: [{ user: sender }],
    readBy: [{ user: sender }]
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { lastMessage: message._id },
    $currentDate: { updatedAt: true }
  });

  return Message.findById(message._id).populate(messagePopulate);
};

const sendPrivateMessage = async ({ userId, recipientId, content, attachments, io }) => {
  const conversation = await getOrCreatePrivateConversation(userId, recipientId);
  const message = await saveMessage({
    conversationId: conversation._id,
    sender: userId,
    content,
    attachments
  });

  await createNotification(
    {
      recipient: recipientId,
      sender: userId,
      type: NOTIFICATION_TYPE.PRIVATE_MESSAGE,
      title: "New private message",
      message: "You have a new private message.",
      data: { conversationId: conversation._id, messageId: message._id }
    },
    io
  );

  return { conversation, message };
};

const sendProjectMessage = async ({ userId, projectId, content, attachments, mentions, io }) => {
  await getProjectOrThrow(projectId);
  await ensureProjectMember(projectId, userId);
  const conversation = await getOrCreateProjectConversation(projectId, userId);
  const message = await saveMessage({
    conversationId: conversation._id,
    sender: userId,
    projectId,
    content,
    attachments,
    mentions
  });

  if (mentions?.length) {
    await Promise.all(
      mentions.map((recipient) =>
        createNotification(
          {
            recipient,
            sender: userId,
            type: NOTIFICATION_TYPE.PROJECT_MESSAGE,
            title: "You were mentioned in project chat",
            message: "A team member mentioned you in the project chat.",
            data: { projectId, conversationId: conversation._id, messageId: message._id }
          },
          io
        )
      )
    );
  }

  return { conversation, message };
};

const markMessagesAsRead = async ({ userId, conversationId, messageIds = [] }) => {
  await getConversationById(userId, conversationId);

  const filter = {
    conversation: conversationId,
    "readBy.user": { $ne: userId }
  };

  if (messageIds.length) {
    filter._id = { $in: messageIds };
  }

  await Message.updateMany(filter, {
    $addToSet: {
      readBy: {
        user: userId,
        at: new Date()
      }
    }
  });

  return true;
};

const editMessage = async ({ userId, messageId, content }) => {
  const message = await Message.findById(messageId).populate({
    path: "conversation",
    populate: { path: "participants", select: "_id" }
  });

  if (!message || message.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  if (String(message.sender) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the sender can edit this message");
  }

  message.content = content;
  message.isEdited = true;
  await message.save();

  return Message.findById(message._id).populate([
    {
      path: "conversation",
      populate: { path: "participants", select: "_id" }
    },
    ...messagePopulate
  ]);
};

const deleteMessage = async ({ userId, messageId }) => {
  const message = await Message.findById(messageId).populate({
    path: "conversation",
    populate: { path: "participants", select: "_id" }
  });

  if (!message || message.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  if (String(message.sender) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the sender can delete this message");
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = "[message deleted]";
  await message.save();

  return Message.findById(message._id).populate([
    {
      path: "conversation",
      populate: { path: "participants", select: "_id" }
    },
    ...messagePopulate
  ]);
};

module.exports = {
  getOrCreatePrivateConversation,
  getMyConversations,
  getConversationMessages,
  getProjectConversationMessages,
  sendPrivateMessage,
  sendProjectMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage
};
