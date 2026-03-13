const express = require("express");

const collaborationController = require("../controllers/collaborationController");
const projectController = require("../controllers/projectController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  createProjectValidator,
  updateProjectValidator,
  listProjectsValidator,
  projectStatusValidator,
  projectIdValidator
} = require("../validators/projectValidator");
const {
  applyValidator,
  invitationValidator,
  assignRoleValidator,
  decisionValidator,
  invitationDecisionValidator,
  memberActionValidator
} = require("../validators/collaborationValidator");

const router = express.Router();

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List projects with pagination, filtering and sorting
 *     tags: [Projects]
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 */
router.get("/", listProjectsValidator, validate, projectController.listProjects);
router.post("/", protect, createProjectValidator, validate, projectController.createProject);
router.get("/applications/me", protect, collaborationController.listMyApplications);
router.get("/invitations/received", protect, collaborationController.listReceivedInvitations);
router.patch(
  "/invitations/:invitationId/accept",
  protect,
  invitationDecisionValidator,
  validate,
  collaborationController.acceptInvitation
);
router.patch(
  "/invitations/:invitationId/decline",
  protect,
  invitationDecisionValidator,
  validate,
  collaborationController.declineInvitation
);
router.get("/mine", protect, projectController.getMyProjects);
router.get("/saved", protect, projectController.getSavedProjects);
router.get("/:id", projectIdValidator, validate, projectController.getSingleProject);
router.patch("/:id", protect, updateProjectValidator, validate, projectController.updateProject);
router.delete("/:id", protect, projectIdValidator, validate, projectController.deleteProject);
router.patch("/:id/status", protect, projectStatusValidator, validate, projectController.changeProjectStatus);
router.post("/:id/bookmark", protect, projectIdValidator, validate, projectController.bookmarkProject);
router.delete("/:id/bookmark", protect, projectIdValidator, validate, projectController.unbookmarkProject);
router.get("/:id/team", projectIdValidator, validate, projectController.viewMembers);

router.post("/:id/applications", protect, applyValidator, validate, collaborationController.applyToProject);
router.get("/:id/applications", protect, projectIdValidator, validate, collaborationController.listProjectApplications);
router.patch(
  "/:id/applications/:applicationId/accept",
  protect,
  decisionValidator,
  validate,
  collaborationController.acceptApplication
);
router.patch(
  "/:id/applications/:applicationId/reject",
  protect,
  decisionValidator,
  validate,
  collaborationController.rejectApplication
);
router.delete(
  "/:id/applications/:applicationId/withdraw",
  protect,
  decisionValidator,
  validate,
  collaborationController.withdrawApplication
);

router.post("/:id/invitations", protect, invitationValidator, validate, collaborationController.inviteStudent);
router.get("/:id/invitations", protect, projectIdValidator, validate, collaborationController.listSentInvitations);
router.delete(
  "/:id/invitations/:invitationId/cancel",
  protect,
  invitationDecisionValidator,
  validate,
  collaborationController.cancelInvitation
);

router.get("/:id/members", protect, projectIdValidator, validate, collaborationController.listProjectMembers);
router.patch("/:id/members/assign-role", protect, assignRoleValidator, validate, collaborationController.assignProjectRole);
router.delete("/:id/members/remove", protect, memberActionValidator, validate, collaborationController.removeMember);
router.delete("/:id/members/leave", protect, projectIdValidator, validate, collaborationController.leaveTeam);

module.exports = router;
