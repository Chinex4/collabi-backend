const { body } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const privateConversationValidator = [
  body("participantId").isMongoId().withMessage("participantId is required")
];

const messageSendValidator = [
  body("content").optional().isString(),
  body("attachments").optional().isArray(),
  body("mentions").optional().isArray()
];

const privateMessageValidator = [
  body("recipientId").isMongoId().withMessage("recipientId is required"),
  ...messageSendValidator
];

const projectMessageValidator = [
  body("projectId").isMongoId().withMessage("projectId is required"),
  ...messageSendValidator
];

const markReadValidator = [
  objectIdParam("conversationId"),
  body("messageIds").optional().isArray()
];

const editMessageValidator = [
  objectIdParam("messageId"),
  body("content").trim().notEmpty().withMessage("content is required")
];

module.exports = {
  privateConversationValidator,
  privateMessageValidator,
  projectMessageValidator,
  markReadValidator,
  editMessageValidator,
  conversationIdValidator: [objectIdParam("conversationId"), ...paginationValidators],
  projectChatValidator: [objectIdParam("projectId"), ...paginationValidators]
};
