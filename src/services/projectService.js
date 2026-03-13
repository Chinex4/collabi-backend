const { StatusCodes } = require("http-status-codes");

const Conversation = require("../models/Conversation");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const { CONVERSATION_TYPE, MEMBERSHIP_STATUS, PROJECT_STATUS } = require("../constants/enums");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { buildSearchRegex, buildSort } = require("../utils/queryBuilder");
const {
  addProjectMember,
  ensureProjectOwner,
  getOrCreateProjectConversation,
  getProjectOrThrow,
  syncProjectTeamState
} = require("./projectAccessService");

const basePopulate = [
  { path: "category", select: "name" },
  { path: "owner", select: "fullName email profileImage" },
  { path: "department", select: "name" },
  { path: "faculty", select: "name" },
  { path: "requiredSkills optionalSkills", select: "name" },
  { path: "attachments.file" }
];

const createProject = async (ownerId, payload) => {
  const owner = await User.findById(ownerId);

  const project = await Project.create({
    ...payload,
    owner: ownerId,
    department: payload.department || owner?.department,
    faculty: payload.faculty || owner?.faculty
  });

  await addProjectMember({
    projectId: project._id,
    userId: ownerId,
    addedBy: ownerId,
    roleName: "owner"
  });

  await getOrCreateProjectConversation(project._id, ownerId);

  return Project.findById(project._id).populate(basePopulate);
};

const updateProject = async (userId, projectId, payload) => {
  const project = await getProjectOrThrow(projectId);
  ensureProjectOwner(project, userId);

  Object.assign(project, payload);
  await project.save();
  await syncProjectTeamState(projectId);

  return Project.findById(projectId).populate(basePopulate);
};

const deleteProject = async (userId, projectId, isAdmin = false) => {
  const project = await getProjectOrThrow(projectId);

  if (!isAdmin) {
    ensureProjectOwner(project, userId);
  }

  project.isDeleted = true;
  project.status = PROJECT_STATUS.CANCELLED;
  project.recruitmentOpen = false;
  await project.save();

  return project;
};

const listProjects = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { isDeleted: false };

  if (query.category) filters.category = query.category;
  if (query.status) filters.status = query.status;
  if (query.department) filters.department = query.department;
  if (query.visibility) filters.visibility = query.visibility;
  if (query.requiredSkill) filters.requiredSkills = query.requiredSkill;
  if (query.recruitmentOpen !== undefined) {
    filters.recruitmentOpen = query.recruitmentOpen === "true";
  }
  if (query.dateFrom || query.dateTo) {
    filters.createdAt = {};
    if (query.dateFrom) filters.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filters.createdAt.$lte = new Date(query.dateTo);
  }
  if (query.search) {
    if (query.sort === "relevance") {
      filters.$text = { $search: query.search };
    } else {
      filters.$or = [
        { title: buildSearchRegex(query.search) },
        { description: buildSearchRegex(query.search) },
        { tags: buildSearchRegex(query.search) }
      ];
    }
  }

  const sortMap = {
    recent: "-createdAt",
    deadline: "deadline",
    relevance: query.search ? { score: { $meta: "textScore" } } : "-createdAt"
  };

  const sort = sortMap[query.sort] || buildSort(query.sortBy, "-createdAt");

  const listQuery = Project.find(filters).populate(basePopulate).skip(skip).limit(limit);
  if (query.sort === "relevance" && query.search) {
    listQuery.sort(sort).select({
      score: { $meta: "textScore" }
    });
  } else {
    listQuery.sort(sort);
  }

  const [items, total] = await Promise.all([listQuery, Project.countDocuments(filters)]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getSingleProject = async (projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false
  }).populate(basePopulate);

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  return project;
};

const getMyCreatedProjects = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    owner: userId,
    isDeleted: false
  };

  const [items, total] = await Promise.all([
    Project.find(filters).populate(basePopulate).sort("-createdAt").skip(skip).limit(limit),
    Project.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const bookmarkProject = async (userId, projectId) => {
  await getProjectOrThrow(projectId);
  await User.findByIdAndUpdate(userId, { $addToSet: { savedProjects: projectId } });
  return getSavedProjects(userId);
};

const unbookmarkProject = async (userId, projectId) => {
  await User.findByIdAndUpdate(userId, { $pull: { savedProjects: projectId } });
  return getSavedProjects(userId);
};

const getSavedProjects = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "savedProjects",
    populate: basePopulate
  });

  return user?.savedProjects || [];
};

const changeProjectStatus = async (userId, projectId, status, isAdmin = false) => {
  const project = await getProjectOrThrow(projectId);

  if (!isAdmin) {
    ensureProjectOwner(project, userId);
  }

  project.status = status;

  if ([PROJECT_STATUS.CLOSED, PROJECT_STATUS.CANCELLED, PROJECT_STATUS.COMPLETED].includes(status)) {
    project.recruitmentOpen = false;
  }

  await project.save();

  return Project.findById(projectId).populate(basePopulate);
};

const viewProjectMembers = async (projectId) =>
  ProjectMember.find({
    project: projectId,
    status: MEMBERSHIP_STATUS.ACTIVE
  }).populate("user", "fullName email role profileImage department faculty");

const ensureProjectChatExists = async (projectId, userId) => {
  const conversation = await getOrCreateProjectConversation(projectId, userId);

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      participants: await ProjectMember.find({
        project: projectId,
        status: MEMBERSHIP_STATUS.ACTIVE
      }).distinct("user")
    }
  });

  return conversation;
};

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  listProjects,
  getSingleProject,
  getMyCreatedProjects,
  bookmarkProject,
  unbookmarkProject,
  getSavedProjects,
  changeProjectStatus,
  viewProjectMembers,
  ensureProjectChatExists,
  getProjectOrThrow
};
