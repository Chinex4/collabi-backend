const express = require("express");

const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { objectIdParam, paginationValidators } = require("../validators/commonValidator");

const router = express.Router();

router.use(protect);

router.get("/", paginationValidators, validate, notificationController.getNotifications);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/:id/read", objectIdParam("id"), validate, notificationController.markOneRead);
router.patch("/mark-all-read", notificationController.markAllRead);
router.delete("/:id", objectIdParam("id"), validate, notificationController.deleteNotification);

module.exports = router;
