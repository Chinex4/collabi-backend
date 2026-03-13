const express = require("express");

const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  privateConversationValidator,
  privateMessageValidator,
  projectMessageValidator,
  markReadValidator,
  editMessageValidator,
  conversationIdValidator,
  projectChatValidator
} = require("../validators/chatValidator");

const router = express.Router();

router.use(protect);

router.get("/conversations", chatController.getConversations);
router.post("/conversations/private", privateConversationValidator, validate, chatController.createOrFetchPrivateConversation);
router.get("/conversations/:conversationId/messages", conversationIdValidator, validate, chatController.getConversationMessages);
router.get("/projects/:projectId/messages", projectChatValidator, validate, chatController.getProjectMessages);
router.post("/messages/private", privateMessageValidator, validate, chatController.sendPrivateMessage);
router.post("/messages/project", projectMessageValidator, validate, chatController.sendProjectMessage);
router.patch("/conversations/:conversationId/read", markReadValidator, validate, chatController.markAsRead);
router.patch("/messages/:messageId", editMessageValidator, validate, chatController.editMessage);
router.delete("/messages/:messageId", editMessageValidator.slice(0, 1), validate, chatController.deleteMessage);

module.exports = router;
