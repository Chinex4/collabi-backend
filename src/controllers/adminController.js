const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const adminService = require("../services/adminService");

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await adminService.getDashboardSummary();
  sendSuccess(res, {
    message: "Admin dashboard fetched successfully",
    data: dashboard
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  sendSuccess(res, {
    message: "Users fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  sendSuccess(res, {
    message: "User fetched successfully",
    data: user
  });
});

const getUserActivity = asyncHandler(async (req, res) => {
  const summary = await adminService.getUserActivitySummary(req.params.id);
  sendSuccess(res, {
    message: "User activity summary fetched successfully",
    data: summary
  });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserFlags(req.params.id, {
    isSuspended: true,
    suspensionReason: req.body.reason || "Suspended by admin"
  });
  sendSuccess(res, {
    message: "User suspended successfully",
    data: user
  });
});

const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserFlags(req.params.id, {
    isSuspended: false,
    suspensionReason: ""
  });
  sendSuccess(res, {
    message: "User unsuspended successfully",
    data: user
  });
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserFlags(req.params.id, {
    isEmailVerified: true
  });
  sendSuccess(res, {
    message: "User verified successfully",
    data: user
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await adminService.deleteUser(req.params.id);
  sendSuccess(res, {
    message: "User deleted successfully",
    data: user
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await adminService.resetUserPassword({
    userId: req.params.id,
    password: req.body.password
  });
  sendSuccess(res, {
    message: "User password reset successfully",
    data: user
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const result = await adminService.getProjects(req.query);
  sendSuccess(res, {
    message: "Projects fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await adminService.getProjectById(req.params.id);
  sendSuccess(res, {
    message: "Project fetched successfully",
    data: project
  });
});

const changeProjectStatus = asyncHandler(async (req, res) => {
  const project = await adminService.updateProjectStatus(req.params.id, req.body.status);
  sendSuccess(res, {
    message: "Project status updated successfully",
    data: project
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await adminService.removeProject(req.params.id);
  sendSuccess(res, {
    message: "Project deleted successfully",
    data: project
  });
});

const getReports = asyncHandler(async (req, res) => {
  const result = await adminService.listAdminReports(req.query);
  sendSuccess(res, {
    message: "Reports fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await adminService.getAdminReport(req.params.id);
  sendSuccess(res, {
    message: "Report fetched successfully",
    data: report
  });
});

const resolveReport = asyncHandler(async (req, res) => {
  const report = await adminService.resolveAdminReport({
    adminId: req.user._id,
    reportId: req.params.id,
    resolutionNote: req.body.resolutionNote,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    message: "Report resolved successfully",
    data: report
  });
});

const dismissReport = asyncHandler(async (req, res) => {
  const report = await adminService.dismissAdminReport({
    adminId: req.user._id,
    reportId: req.params.id,
    resolutionNote: req.body.resolutionNote,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    message: "Report dismissed successfully",
    data: report
  });
});

const takeReportAction = asyncHandler(async (req, res) => {
  const report = await adminService.performModerationAction({
    adminId: req.user._id,
    reportId: req.params.id,
    action: req.body.action,
    note: req.body.resolutionNote,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    message: "Moderation action applied successfully",
    data: report
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getDashboardSummary();
  sendSuccess(res, {
    message: "Analytics fetched successfully",
    data: analytics
  });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminService.listAuditLogs(req.query);
  sendSuccess(res, {
    message: "Audit logs fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getSettings = asyncHandler(async (req, res) => {
  const result = await adminService.listSettings(req.query);
  sendSuccess(res, {
    message: "Settings fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const upsertSetting = asyncHandler(async (req, res) => {
  const setting = await adminService.upsertSetting(req.body);
  sendSuccess(res, {
    message: "Setting saved successfully",
    data: setting
  });
});

const deleteSetting = asyncHandler(async (req, res) => {
  const setting = await adminService.deleteSetting(req.params.id);
  sendSuccess(res, {
    message: "Setting deleted successfully",
    data: setting
  });
});

const sendAnnouncement = asyncHandler(async (req, res) => {
  const result = await adminService.sendAnnouncement({
    adminId: req.user._id,
    title: req.body.title,
    message: req.body.message,
    io: req.app.get("io")
  });
  sendSuccess(res, {
    message: "Announcement sent successfully",
    data: result
  });
});

module.exports = {
  getDashboard,
  getUsers,
  getUser,
  getUserActivity,
  suspendUser,
  unsuspendUser,
  verifyUser,
  deleteUser,
  resetUserPassword,
  getProjects,
  getProject,
  changeProjectStatus,
  deleteProject,
  getReports,
  getReport,
  resolveReport,
  dismissReport,
  takeReportAction,
  getAnalytics,
  getAuditLogs,
  getSettings,
  upsertSetting,
  deleteSetting,
  sendAnnouncement
};
