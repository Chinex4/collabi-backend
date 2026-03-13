const Notification = require("../models/Notification");

const createNotification = async (payload, io = null) => {
  const notification = await Notification.create(payload);
  const populated = await notification.populate("sender", "fullName email role");

  if (io) {
    io.to(`user:${String(payload.recipient)}`).emit("notification:new", populated);
  }

  return populated;
};

const notifyMany = async ({ recipients, ...payload }, io = null) =>
  Promise.all(
    recipients.map((recipient) =>
      createNotification(
        {
          ...payload,
          recipient
        },
        io
      )
    )
  );

const getMyNotifications = async (userId, { page, limit, skip }) => {
  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate("sender", "fullName email role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return { items, total, unreadCount };
};

const markNotificationAsRead = async (userId, notificationId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

const markAllNotificationsAsRead = async (userId) =>
  Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

const deleteNotification = async (userId, notificationId) =>
  Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId
  });

const getUnreadCount = async (userId) =>
  Notification.countDocuments({ recipient: userId, isRead: false });

module.exports = {
  createNotification,
  notifyMany,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
};
