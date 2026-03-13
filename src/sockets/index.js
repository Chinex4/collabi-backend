const { Server } = require("socket.io");

const User = require("../models/User");
const { verifyAccessToken } = require("../utils/token");
const chatService = require("../services/chatService");
const { ensureProjectMember } = require("../services/projectAccessService");

const onlineUsers = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || user.isDeleted || !user.isActive) {
        return next(new Error("User is not available"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user._id);

    socket.join(`user:${userId}`);
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      lastSeen: new Date()
    });

    io.emit("presence_update", {
      userId,
      status: "online"
    });

    socket.on("join_project_room", async ({ projectId }) => {
      try {
        await ensureProjectMember(projectId, userId);
        socket.join(`project:${projectId}`);
        socket.emit("joined_project_room", { projectId });
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("leave_project_room", ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      socket.emit("left_project_room", { projectId });
    });

    socket.on("private_message", async (payload) => {
      try {
        const result = await chatService.sendPrivateMessage({
          userId,
          recipientId: payload.recipientId,
          content: payload.content,
          attachments: payload.attachments || [],
          io
        });

        io.to(`user:${String(payload.recipientId)}`).emit("private_message", result);
        socket.emit("private_message", result);
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("project_message", async (payload) => {
      try {
        const result = await chatService.sendProjectMessage({
          userId,
          projectId: payload.projectId,
          content: payload.content,
          attachments: payload.attachments || [],
          mentions: payload.mentions || [],
          io
        });

        io.to(`project:${payload.projectId}`).emit("project_message", result);
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("typing_start", ({ projectId, recipientId, conversationId }) => {
      if (projectId) {
        socket.to(`project:${projectId}`).emit("typing_start", { projectId, userId });
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit("typing_start", {
          recipientId,
          userId,
          conversationId
        });
      }
    });

    socket.on("typing_stop", ({ projectId, recipientId, conversationId }) => {
      if (projectId) {
        socket.to(`project:${projectId}`).emit("typing_stop", { projectId, userId });
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit("typing_stop", {
          recipientId,
          userId,
          conversationId
        });
      }
    });

    socket.on("mark_as_read", async ({ conversationId, messageIds }) => {
      try {
        await chatService.markMessagesAsRead({
          userId,
          conversationId,
          messageIds: messageIds || []
        });
        io.to(`user:${userId}`).emit("messages_read", {
          conversationId,
          messageIds: messageIds || []
        });
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("message_edited", async ({ messageId, content }) => {
      try {
        const message = await chatService.editMessage({
          userId,
          messageId,
          content
        });
        message.conversation?.participants?.forEach((participant) => {
          io.to(`user:${String(participant._id || participant)}`).emit("message_edited", message);
        });
        if (message.project) {
          io.to(`project:${String(message.project)}`).emit("message_edited", message);
        }
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("message_deleted", async ({ messageId }) => {
      try {
        const message = await chatService.deleteMessage({
          userId,
          messageId
        });
        message.conversation?.participants?.forEach((participant) => {
          io.to(`user:${String(participant._id || participant)}`).emit("message_deleted", message);
        });
        if (message.project) {
          io.to(`project:${String(message.project)}`).emit("message_deleted", message);
        }
      } catch (error) {
        socket.emit("socket_error", { message: error.message });
      }
    });

    socket.on("presence_update", async ({ status }) => {
      io.emit("presence_update", {
        userId,
        status: status || "online"
      });
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date()
      });

      io.emit("presence_update", {
        userId,
        status: "offline",
        lastSeen: new Date()
      });
    });
  });

  return io;
};

module.exports = setupSocket;
