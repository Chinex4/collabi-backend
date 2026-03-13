const { StatusCodes } = require("http-status-codes");

const Conversation = require("../models/Conversation");
const Project = require("../models/Project");
const ProjectApplication = require("../models/ProjectApplication");
const ProjectMember = require("../models/ProjectMember");
const { CONVERSATION_TYPE, MEMBERSHIP_STATUS, PROJECT_STATUS } = require("../constants/enums");
const ApiError = require("../utils/ApiError");

const getProjectOrThrow = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  return project;
};

const ensureProjectOwner = (project, userId) => {
  if (String(project.owner) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the project owner can perform this action");
  }
};

const ensureProjectMember = async (projectId, userId) => {
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  if (!membership) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only project members can access this resource");
  }

  return membership;
};

const getOrCreateProjectConversation = async (projectId, createdBy) => {
  let conversation = await Conversation.findOne({
    type: CONVERSATION_TYPE.PROJECT,
    project: projectId
  });

  if (!conversation) {
    const members = await ProjectMember.find({
      project: projectId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select("user");

    conversation = await Conversation.create({
      type: CONVERSATION_TYPE.PROJECT,
      project: projectId,
      createdBy,
      participants: members.map((member) => member.user)
    });
  }

  return conversation;
};

const syncProjectTeamState = async (projectId) => {
  const memberCount = await ProjectMember.countDocuments({
    project: projectId,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  const project = await Project.findById(projectId);

  if (!project) return null;

  project.currentTeamSize = memberCount;
  project.recruitmentOpen = memberCount < project.maxTeamSize;

  if (memberCount >= project.maxTeamSize && project.status === PROJECT_STATUS.OPEN) {
    project.status = PROJECT_STATUS.CLOSED;
  }

  await project.save();

  await Conversation.findOneAndUpdate(
    { type: CONVERSATION_TYPE.PROJECT, project: projectId },
    {
      $set: {
        participants: await ProjectMember.find({
          project: projectId,
          status: MEMBERSHIP_STATUS.ACTIVE
        }).distinct("user")
      }
    }
  );

  if (!project.recruitmentOpen) {
    await ProjectApplication.updateMany(
      {
        project: projectId,
        status: "pending"
      },
      {
        $set: {
          status: "rejected",
          reviewNote: "Recruitment closed because the team is full",
          reviewedAt: new Date()
        }
      }
    );
  }

  return project;
};

const addProjectMember = async ({ projectId, userId, addedBy, roleName = "member" }) => {
  const project = await getProjectOrThrow(projectId);

  if (project.currentTeamSize >= project.maxTeamSize) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Project team is already full");
  }

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  if (existingMember) {
    throw new ApiError(StatusCodes.CONFLICT, "User is already a project member");
  }

  const member = await ProjectMember.create({
    project: projectId,
    user: userId,
    roleName,
    addedBy
  });

  await getOrCreateProjectConversation(projectId, addedBy || userId);
  await syncProjectTeamState(projectId);

  return member;
};

const deactivateProjectMember = async ({ projectId, userId, status }) => {
  const member = await ProjectMember.findOneAndUpdate(
    {
      project: projectId,
      user: userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    },
    {
      $set: { status }
    },
    { new: true }
  );

  if (!member) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project member not found");
  }

  await syncProjectTeamState(projectId);
  return member;
};

module.exports = {
  getProjectOrThrow,
  ensureProjectOwner,
  ensureProjectMember,
  getOrCreateProjectConversation,
  syncProjectTeamState,
  addProjectMember,
  deactivateProjectMember
};
