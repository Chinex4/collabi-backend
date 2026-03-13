const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const collaborationService = require("../services/collaborationService");

const applyToProject = asyncHandler(async (req, res) => {
  const application = await collaborationService.applyToProject({
    userId: req.user._id,
    projectId: req.params.id,
    message: req.body.message,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Application submitted successfully",
    data: application
  });
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await collaborationService.withdrawApplication({
    userId: req.user._id,
    applicationId: req.params.applicationId
  });

  sendSuccess(res, {
    message: "Application withdrawn successfully",
    data: application
  });
});

const listMyApplications = asyncHandler(async (req, res) => {
  const result = await collaborationService.listMyApplications(req.user._id, req.query);
  sendSuccess(res, {
    message: "Applications fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const listProjectApplications = asyncHandler(async (req, res) => {
  const result = await collaborationService.listProjectApplications({
    userId: req.user._id,
    projectId: req.params.id,
    query: req.query
  });

  sendSuccess(res, {
    message: "Project applications fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const acceptApplication = asyncHandler(async (req, res) => {
  const application = await collaborationService.acceptApplication({
    userId: req.user._id,
    projectId: req.params.id,
    applicationId: req.params.applicationId,
    roleName: req.body.roleName,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Application accepted successfully",
    data: application
  });
});

const rejectApplication = asyncHandler(async (req, res) => {
  const application = await collaborationService.rejectApplication({
    userId: req.user._id,
    projectId: req.params.id,
    applicationId: req.params.applicationId,
    reviewNote: req.body.reviewNote,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Application rejected successfully",
    data: application
  });
});

const inviteStudent = asyncHandler(async (req, res) => {
  const invitation = await collaborationService.inviteStudent({
    userId: req.user._id,
    projectId: req.params.id,
    invitedUser: req.body.invitedUser,
    message: req.body.message,
    proposedRole: req.body.proposedRole,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Invitation sent successfully",
    data: invitation
  });
});

const listSentInvitations = asyncHandler(async (req, res) => {
  const result = await collaborationService.listSentInvitations({
    userId: req.user._id,
    projectId: req.params.id,
    query: req.query
  });

  sendSuccess(res, {
    message: "Sent invitations fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const listReceivedInvitations = asyncHandler(async (req, res) => {
  const result = await collaborationService.listReceivedInvitations(req.user._id, req.query);
  sendSuccess(res, {
    message: "Received invitations fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const invitation = await collaborationService.acceptInvitation({
    userId: req.user._id,
    invitationId: req.params.invitationId,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Invitation accepted successfully",
    data: invitation
  });
});

const declineInvitation = asyncHandler(async (req, res) => {
  const invitation = await collaborationService.declineInvitation({
    userId: req.user._id,
    invitationId: req.params.invitationId,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Invitation declined successfully",
    data: invitation
  });
});

const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await collaborationService.cancelInvitation({
    userId: req.user._id,
    invitationId: req.params.invitationId
  });

  sendSuccess(res, {
    message: "Invitation cancelled successfully",
    data: invitation
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const member = await collaborationService.removeMember({
    userId: req.user._id,
    projectId: req.params.id,
    memberUserId: req.body.memberUserId,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Member removed successfully",
    data: member
  });
});

const leaveTeam = asyncHandler(async (req, res) => {
  const member = await collaborationService.leaveTeam({
    userId: req.user._id,
    projectId: req.params.id,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "You left the project team successfully",
    data: member
  });
});

const assignProjectRole = asyncHandler(async (req, res) => {
  const member = await collaborationService.assignProjectRole({
    userId: req.user._id,
    projectId: req.params.id,
    memberUserId: req.body.memberUserId,
    roleName: req.body.roleName
  });

  sendSuccess(res, {
    message: "Member role assigned successfully",
    data: member
  });
});

const listProjectMembers = asyncHandler(async (req, res) => {
  const members = await collaborationService.listProjectMembers(req.params.id);
  sendSuccess(res, {
    message: "Project members fetched successfully",
    data: members
  });
});

module.exports = {
  applyToProject,
  withdrawApplication,
  listMyApplications,
  listProjectApplications,
  acceptApplication,
  rejectApplication,
  inviteStudent,
  listSentInvitations,
  listReceivedInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  removeMember,
  leaveTeam,
  assignProjectRole,
  listProjectMembers
};
