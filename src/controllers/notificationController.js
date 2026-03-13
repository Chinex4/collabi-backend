const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { buildPagination, buildMeta } = require("../utils/pagination");
const notificationService = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res) => {
  const pagination = buildPagination(req.query);
  const result = await notificationService.getMyNotifications(req.user._id, pagination);
  sendSuccess(res, {
    message: "Notifications fetched successfully",
    data: result.items,
    meta: {
      ...buildMeta({ page: pagination.page, limit: pagination.limit, total: result.total }),
      unreadCount: result.unreadCount
    }
  });
});

const markOneRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(req.user._id, req.params.id);
  sendSuccess(res, {
    message: "Notification marked as read",
    data: notification
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user._id);
  sendSuccess(res, {
    message: "All notifications marked as read"
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(req.user._id, req.params.id);
  sendSuccess(res, {
    message: "Notification deleted successfully",
    data: notification
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  sendSuccess(res, {
    message: "Unread count fetched successfully",
    data: { count }
  });
});

module.exports = {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
  unreadCount
};
