const { StatusCodes } = require("http-status-codes");

const AuditLog = require("../models/AuditLog");
const Message = require("../models/Message");
const PlatformSetting = require("../models/PlatformSetting");
const Project = require("../models/Project");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { buildSearchRegex, buildSort } = require("../utils/queryBuilder");
const { getAdminAnalytics } = require("./analyticsService");
const { createNotification } = require("./notificationService");
const userService = require("./userService");
const { listReports, getReportById, takeModerationAction, updateReportStatus } = require("./reportService");

const getDashboardSummary = async () => getAdminAnalytics();

const getUsers = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { isDeleted: false };

  if (query.search) {
    filters.$or = [
      { fullName: buildSearchRegex(query.search) },
      { email: buildSearchRegex(query.search) }
    ];
  }
  if (query.role) filters.role = query.role;
  if (query.isSuspended !== undefined) filters.isSuspended = query.isSuspended === "true";

  const [items, total] = await Promise.all([
    User.find(filters)
      .populate("faculty department", "name")
      .sort(buildSort(query.sortBy, "-createdAt"))
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).populate("faculty department", "name");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const updateUserFlags = async (userId, payload) => {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const deleteUser = async (userId) => updateUserFlags(userId, { isDeleted: true, isActive: false });

const getUserActivitySummary = (userId) => userService.getUserActivitySummary(userId);

const resetUserPassword = async ({ userId, password }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  user.password = password;
  await user.save();
  return user;
};

const getProjects = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.category) filters.category = query.category;
  if (query.search) {
    filters.$or = [
      { title: buildSearchRegex(query.search) },
      { description: buildSearchRegex(query.search) }
    ];
  }

  const [items, total] = await Promise.all([
    Project.find(filters)
      .populate("owner category department faculty", "fullName name")
      .sort(buildSort(query.sortBy, "-createdAt"))
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId).populate(
    "owner category department faculty requiredSkills optionalSkills attachments.file"
  );

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  return project;
};

const updateProjectStatus = async (projectId, status) => {
  const project = await Project.findByIdAndUpdate(projectId, { status }, { new: true });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  return project;
};

const removeProject = async (projectId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { isDeleted: true, recruitmentOpen: false, status: "cancelled" },
    { new: true }
  );

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  return project;
};

const listAuditLogs = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};
  if (query.action) filters.action = query.action;

  const [items, total] = await Promise.all([
    AuditLog.find(filters).populate("actor", "fullName email role").sort("-createdAt").skip(skip).limit(limit),
    AuditLog.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const listAdminReports = listReports;

const getAdminReport = getReportById;

const resolveAdminReport = ({ adminId, reportId, resolutionNote, io }) =>
  updateReportStatus({
    adminId,
    reportId,
    status: "resolved",
    resolutionNote,
    io
  });

const dismissAdminReport = ({ adminId, reportId, resolutionNote, io }) =>
  updateReportStatus({
    adminId,
    reportId,
    status: "dismissed",
    resolutionNote,
    io
  });

const performModerationAction = ({ adminId, reportId, action, note, io }) =>
  takeModerationAction({
    adminId,
    reportId,
    action,
    note,
    io
  });

const listSettings = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.search) filters.key = buildSearchRegex(query.search);

  const [items, total] = await Promise.all([
    PlatformSetting.find(filters).sort("key").skip(skip).limit(limit),
    PlatformSetting.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const upsertSetting = async ({ key, value, description, isPublic }) =>
  PlatformSetting.findOneAndUpdate(
    { key },
    { value, description, isPublic },
    { upsert: true, new: true, runValidators: true }
  );

const deleteSetting = async (id) => {
  const setting = await PlatformSetting.findByIdAndDelete(id);

  if (!setting) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Setting not found");
  }

  return setting;
};

const sendAnnouncement = async ({ adminId, title, message, io }) => {
  const users = await User.find({ isDeleted: false, isActive: true }).select("_id");

  await Promise.all(
    users.map((user) =>
      createNotification(
        {
          recipient: user._id,
          sender: adminId,
          type: "admin_announcement",
          title,
          message,
          data: {}
        },
        io
      )
    )
  );

  return { count: users.length };
};

const removeMessage = async (messageId) => {
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      content: "[message removed by admin]"
    },
    { new: true }
  );

  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  return message;
};

module.exports = {
  getDashboardSummary,
  getUsers,
  getUserById,
  getUserActivitySummary,
  updateUserFlags,
  deleteUser,
  resetUserPassword,
  getProjects,
  getProjectById,
  updateProjectStatus,
  removeProject,
  listAuditLogs,
  listAdminReports,
  getAdminReport,
  resolveAdminReport,
  dismissAdminReport,
  performModerationAction,
  listSettings,
  upsertSetting,
  deleteSetting,
  sendAnnouncement,
  removeMessage
};
