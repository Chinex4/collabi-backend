const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const reportService = require("../services/reportService");

const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport({
    userId: req.user._id,
    payload: req.body
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Report submitted successfully",
    data: report
  });
});

const getMyReports = asyncHandler(async (req, res) => {
  const result = await reportService.getMyReports(req.user._id, req.query);
  sendSuccess(res, {
    message: "Reports fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

module.exports = {
  createReport,
  getMyReports
};
