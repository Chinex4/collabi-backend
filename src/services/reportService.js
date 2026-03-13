const { StatusCodes } = require("http-status-codes");

const Message = require("../models/Message");
const Project = require("../models/Project");
const Report = require("../models/Report");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { createNotification } = require("./notificationService");
const { NOTIFICATION_TYPE, REPORT_STATUS, REPORT_TARGET_TYPE } = require("../constants/enums");

const validateReportTarget = async ({ targetType, targetId }) => {
  let targetExists = false;

  if (targetType === REPORT_TARGET_TYPE.USER) {
    targetExists = !!(await User.findById(targetId));
  }
  if (targetType === REPORT_TARGET_TYPE.PROJECT) {
    targetExists = !!(await Project.findById(targetId));
  }
  if (targetType === REPORT_TARGET_TYPE.MESSAGE) {
    targetExists = !!(await Message.findById(targetId));
  }

  if (!targetExists) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Report target does not exist");
  }
};

const createReport = async ({ userId, payload }) => {
  await validateReportTarget(payload);

  return Report.create({
    reporter: userId,
    ...payload
  });
};

const getMyReports = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { reporter: userId };

  const [items, total] = await Promise.all([
    Report.find(filters).sort("-createdAt").skip(skip).limit(limit),
    Report.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const listReports = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.targetType) filters.targetType = query.targetType;

  const [items, total] = await Promise.all([
    Report.find(filters)
      .populate("reporter reviewedBy", "fullName email role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getReportById = async (reportId) => {
  const report = await Report.findById(reportId).populate("reporter reviewedBy", "fullName email role");

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");
  }

  return report;
};

const updateReportStatus = async ({ adminId, reportId, status, resolutionNote, io }) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");
  }

  report.status = status;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  report.resolutionNote = resolutionNote;
  await report.save();

  await createNotification(
    {
      recipient: report.reporter,
      sender: adminId,
      type: NOTIFICATION_TYPE.REPORT_UPDATE,
      title: "Report reviewed",
      message: `Your report was ${status}.`,
      data: { reportId: report._id, status }
    },
    io
  );

  return report;
};

const takeModerationAction = async ({ adminId, reportId, action, note, io }) => {
  const report = await getReportById(reportId);

  if (report.targetType === REPORT_TARGET_TYPE.USER && action === "suspend_user") {
    await User.findByIdAndUpdate(report.targetId, {
      $set: { isSuspended: true, suspensionReason: note || "Suspended by admin moderation" }
    });
  }

  if (report.targetType === REPORT_TARGET_TYPE.PROJECT && action === "remove_project") {
    await Project.findByIdAndUpdate(report.targetId, {
      $set: { isDeleted: true, recruitmentOpen: false, status: "cancelled" }
    });
  }

  if (report.targetType === REPORT_TARGET_TYPE.MESSAGE && action === "remove_message") {
    await Message.findByIdAndUpdate(report.targetId, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "[message removed by admin]"
      }
    });
  }

  return updateReportStatus({
    adminId,
    reportId,
    status: REPORT_STATUS.RESOLVED,
    resolutionNote: note,
    io
  });
};

module.exports = {
  createReport,
  getMyReports,
  listReports,
  getReportById,
  updateReportStatus,
  takeModerationAction
};
