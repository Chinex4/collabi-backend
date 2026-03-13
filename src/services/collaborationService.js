const { StatusCodes } = require("http-status-codes");

const ProjectApplication = require("../models/ProjectApplication");
const ProjectInvitation = require("../models/ProjectInvitation");
const ProjectMember = require("../models/ProjectMember");
const { APPLICATION_STATUS, INVITATION_STATUS, MEMBERSHIP_STATUS, NOTIFICATION_TYPE } =
  require("../constants/enums");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { createNotification } = require("./notificationService");
const {
  addProjectMember,
  deactivateProjectMember,
  ensureProjectOwner,
  getProjectOrThrow,
  syncProjectTeamState
} = require("./projectAccessService");

const applyToProject = async ({ userId, projectId, message, io }) => {
  const project = await getProjectOrThrow(projectId);

  if (!project.recruitmentOpen) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Project recruitment is closed");
  }

  if (String(project.owner) === String(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Project owner cannot apply to their own project");
  }

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  if (existingMember) {
    throw new ApiError(StatusCodes.CONFLICT, "You are already a project member");
  }

  let application = await ProjectApplication.findOne({
    project: projectId,
    applicant: userId
  });

  if (application && [APPLICATION_STATUS.PENDING, APPLICATION_STATUS.ACCEPTED].includes(application.status)) {
    throw new ApiError(StatusCodes.CONFLICT, "You already have an active application for this project");
  }

  if (application) {
    application.status = APPLICATION_STATUS.PENDING;
    application.message = message || application.message;
    application.reviewedBy = undefined;
    application.reviewedAt = undefined;
    application.reviewNote = undefined;
    await application.save();
  } else {
    application = await ProjectApplication.create({
      project: projectId,
      applicant: userId,
      message
    });
  }

  await createNotification(
    {
      recipient: project.owner,
      sender: userId,
      type: NOTIFICATION_TYPE.APPLICATION_SUBMITTED,
      title: "New project application",
      message: "A student applied to join your project.",
      data: { projectId, applicationId: application._id }
    },
    io
  );

  return application;
};

const withdrawApplication = async ({ userId, applicationId }) => {
  const application = await ProjectApplication.findOne({
    _id: applicationId,
    applicant: userId,
    status: APPLICATION_STATUS.PENDING
  });

  if (!application) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending application not found");
  }

  application.status = APPLICATION_STATUS.WITHDRAWN;
  await application.save();

  return application;
};

const listMyApplications = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const [items, total] = await Promise.all([
    ProjectApplication.find({ applicant: userId })
      .populate("project", "title status deadline")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    ProjectApplication.countDocuments({ applicant: userId })
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const listProjectApplications = async ({ userId, projectId, query = {} }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);
  const { page, limit, skip } = buildPagination(query);
  const filters = { project: projectId };

  if (query.status) filters.status = query.status;

  const [items, total] = await Promise.all([
    ProjectApplication.find(filters)
      .populate("applicant", "fullName email profileImage level")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    ProjectApplication.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const acceptApplication = async ({ userId, projectId, applicationId, roleName, io }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    project: projectId,
    status: APPLICATION_STATUS.PENDING
  });

  if (!application) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending application not found");
  }

  await addProjectMember({
    projectId,
    userId: application.applicant,
    addedBy: userId,
    roleName: roleName || "member"
  });

  application.status = APPLICATION_STATUS.ACCEPTED;
  application.reviewedBy = userId;
  application.reviewedAt = new Date();
  await application.save();
  await syncProjectTeamState(projectId);

  await createNotification(
    {
      recipient: application.applicant,
      sender: userId,
      type: NOTIFICATION_TYPE.APPLICATION_DECISION,
      title: "Application accepted",
      message: "Your application was accepted. You have been added to the team.",
      data: { projectId, applicationId: application._id, decision: "accepted" }
    },
    io
  );

  return application;
};

const rejectApplication = async ({ userId, projectId, applicationId, reviewNote, io }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    project: projectId,
    status: APPLICATION_STATUS.PENDING
  });

  if (!application) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending application not found");
  }

  application.status = APPLICATION_STATUS.REJECTED;
  application.reviewedBy = userId;
  application.reviewedAt = new Date();
  application.reviewNote = reviewNote;
  await application.save();

  await createNotification(
    {
      recipient: application.applicant,
      sender: userId,
      type: NOTIFICATION_TYPE.APPLICATION_DECISION,
      title: "Application rejected",
      message: "Your application was not accepted for this project.",
      data: { projectId, applicationId: application._id, decision: "rejected" }
    },
    io
  );

  return application;
};

const inviteStudent = async ({ userId, projectId, invitedUser, message, proposedRole, io }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: invitedUser,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  if (existingMember) {
    throw new ApiError(StatusCodes.CONFLICT, "Student is already a project member");
  }

  let invitation = await ProjectInvitation.findOne({
    project: projectId,
    invitedUser
  });

  if (invitation && [INVITATION_STATUS.PENDING, INVITATION_STATUS.ACCEPTED].includes(invitation.status)) {
    throw new ApiError(StatusCodes.CONFLICT, "An active invitation already exists for this student");
  }

  if (invitation) {
    invitation.invitedBy = userId;
    invitation.message = message;
    invitation.proposedRole = proposedRole || "member";
    invitation.status = INVITATION_STATUS.PENDING;
    invitation.respondedAt = undefined;
    await invitation.save();
  } else {
    invitation = await ProjectInvitation.create({
      project: projectId,
      invitedUser,
      invitedBy: userId,
      message,
      proposedRole
    });
  }

  await createNotification(
    {
      recipient: invitedUser,
      sender: userId,
      type: NOTIFICATION_TYPE.INVITATION_RECEIVED,
      title: "Project invitation",
      message: "You have been invited to join a project team.",
      data: { projectId, invitationId: invitation._id }
    },
    io
  );

  return invitation;
};

const listSentInvitations = async ({ userId, projectId, query = {} }) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { invitedBy: userId };
  if (projectId) filters.project = projectId;

  const [items, total] = await Promise.all([
    ProjectInvitation.find(filters)
      .populate("project", "title status")
      .populate("invitedUser", "fullName email profileImage")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    ProjectInvitation.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const listReceivedInvitations = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { invitedUser: userId };
  if (query.status) filters.status = query.status;

  const [items, total] = await Promise.all([
    ProjectInvitation.find(filters)
      .populate("project", "title status deadline")
      .populate("invitedBy", "fullName email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit),
    ProjectInvitation.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const acceptInvitation = async ({ userId, invitationId, io }) => {
  const invitation = await ProjectInvitation.findOne({
    _id: invitationId,
    invitedUser: userId,
    status: INVITATION_STATUS.PENDING
  });

  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending invitation not found");
  }

  await addProjectMember({
    projectId: invitation.project,
    userId,
    addedBy: invitation.invitedBy,
    roleName: invitation.proposedRole || "member"
  });

  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.respondedAt = new Date();
  await invitation.save();

  await createNotification(
    {
      recipient: invitation.invitedBy,
      sender: userId,
      type: NOTIFICATION_TYPE.INVITATION_DECISION,
      title: "Invitation accepted",
      message: "A student accepted your project invitation.",
      data: { projectId: invitation.project, invitationId: invitation._id, decision: "accepted" }
    },
    io
  );

  return invitation;
};

const declineInvitation = async ({ userId, invitationId, io }) => {
  const invitation = await ProjectInvitation.findOne({
    _id: invitationId,
    invitedUser: userId,
    status: INVITATION_STATUS.PENDING
  });

  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending invitation not found");
  }

  invitation.status = INVITATION_STATUS.DECLINED;
  invitation.respondedAt = new Date();
  await invitation.save();

  await createNotification(
    {
      recipient: invitation.invitedBy,
      sender: userId,
      type: NOTIFICATION_TYPE.INVITATION_DECISION,
      title: "Invitation declined",
      message: "A student declined your project invitation.",
      data: { projectId: invitation.project, invitationId: invitation._id, decision: "declined" }
    },
    io
  );

  return invitation;
};

const cancelInvitation = async ({ userId, invitationId }) => {
  const invitation = await ProjectInvitation.findOne({
    _id: invitationId,
    invitedBy: userId,
    status: INVITATION_STATUS.PENDING
  });

  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending invitation not found");
  }

  invitation.status = INVITATION_STATUS.CANCELLED;
  invitation.respondedAt = new Date();
  await invitation.save();

  return invitation;
};

const removeMember = async ({ userId, projectId, memberUserId, io }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  if (String(project.owner) === String(memberUserId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Project owner cannot be removed");
  }

  const member = await deactivateProjectMember({
    projectId,
    userId: memberUserId,
    status: MEMBERSHIP_STATUS.REMOVED
  });

  await createNotification(
    {
      recipient: memberUserId,
      sender: userId,
      type: NOTIFICATION_TYPE.TEAM_UPDATE,
      title: "Removed from project",
      message: "You were removed from a project team.",
      data: { projectId }
    },
    io
  );

  return member;
};

const leaveTeam = async ({ userId, projectId, io }) => {
  const project = await getProjectOrThrow(projectId);

  if (String(project.owner) === String(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Project owner cannot leave the team");
  }

  const member = await deactivateProjectMember({
    projectId,
    userId,
    status: MEMBERSHIP_STATUS.LEFT
  });

  await createNotification(
    {
      recipient: project.owner,
      sender: userId,
      type: NOTIFICATION_TYPE.TEAM_UPDATE,
      title: "Team member left",
      message: "A project member left your team.",
      data: { projectId }
    },
    io
  );

  return member;
};

const assignProjectRole = async ({ userId, projectId, memberUserId, roleName }) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  const member = await ProjectMember.findOneAndUpdate(
    {
      project: projectId,
      user: memberUserId,
      status: MEMBERSHIP_STATUS.ACTIVE
    },
    { $set: { roleName } },
    { new: true }
  );

  if (!member) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project member not found");
  }

  return member;
};

const listProjectMembers = async (projectId) =>
  ProjectMember.find({
    project: projectId,
    status: MEMBERSHIP_STATUS.ACTIVE
  }).populate("user", "fullName email profileImage level department faculty");

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
