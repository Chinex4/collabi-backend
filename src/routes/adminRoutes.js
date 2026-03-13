const express = require("express");

const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { createAuditLog } = require("../middlewares/auditMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  userFlagValidator,
  resetUserPasswordValidator,
  projectStatusAdminValidator,
  settingValidator,
  announcementValidator,
  moderationActionValidator,
  idParamValidator,
  paginationValidators
} = require("../validators/adminValidator");
const { reviewReportValidator } = require("../validators/reportValidator");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/analytics", adminController.getAnalytics);
router.get("/audit-logs", paginationValidators, validate, adminController.getAuditLogs);

router.get("/users", paginationValidators, validate, adminController.getUsers);
router.get("/users/:id", idParamValidator, validate, adminController.getUser);
router.get("/users/:id/activity", idParamValidator, validate, adminController.getUserActivity);
router.patch(
  "/users/:id/suspend",
  userFlagValidator,
  validate,
  createAuditLog({ action: "suspend_user", targetType: "user", targetIdResolver: (req) => req.params.id }),
  adminController.suspendUser
);
router.patch(
  "/users/:id/unsuspend",
  userFlagValidator,
  validate,
  createAuditLog({ action: "unsuspend_user", targetType: "user", targetIdResolver: (req) => req.params.id }),
  adminController.unsuspendUser
);
router.patch(
  "/users/:id/verify",
  idParamValidator,
  validate,
  createAuditLog({ action: "verify_user", targetType: "user", targetIdResolver: (req) => req.params.id }),
  adminController.verifyUser
);
router.patch("/users/:id/reset-password", resetUserPasswordValidator, validate, adminController.resetUserPassword);
router.delete(
  "/users/:id",
  idParamValidator,
  validate,
  createAuditLog({ action: "delete_user", targetType: "user", targetIdResolver: (req) => req.params.id }),
  adminController.deleteUser
);

router.get("/projects", paginationValidators, validate, adminController.getProjects);
router.get("/projects/:id", idParamValidator, validate, adminController.getProject);
router.patch(
  "/projects/:id/status",
  projectStatusAdminValidator,
  validate,
  createAuditLog({ action: "update_project_status", targetType: "project", targetIdResolver: (req) => req.params.id }),
  adminController.changeProjectStatus
);
router.delete(
  "/projects/:id",
  idParamValidator,
  validate,
  createAuditLog({ action: "delete_project", targetType: "project", targetIdResolver: (req) => req.params.id }),
  adminController.deleteProject
);

router.get("/reports", paginationValidators, validate, adminController.getReports);
router.get("/reports/:id", idParamValidator, validate, adminController.getReport);
router.patch("/reports/:id/resolve", reviewReportValidator, validate, adminController.resolveReport);
router.patch("/reports/:id/dismiss", reviewReportValidator, validate, adminController.dismissReport);
router.patch("/reports/:id/action", moderationActionValidator, validate, adminController.takeReportAction);

router.get("/settings", paginationValidators, validate, adminController.getSettings);
router.post(
  "/settings",
  settingValidator,
  validate,
  createAuditLog({ action: "upsert_setting", targetType: "setting" }),
  adminController.upsertSetting
);
router.delete("/settings/:id", idParamValidator, validate, adminController.deleteSetting);
router.post(
  "/announcements",
  announcementValidator,
  validate,
  createAuditLog({ action: "send_announcement", targetType: "announcement" }),
  adminController.sendAnnouncement
);

module.exports = router;
