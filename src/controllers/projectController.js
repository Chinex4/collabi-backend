const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const projectService = require("../services/projectService");

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Project created successfully",
    data: project
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user._id, req.params.id, req.body);
  sendSuccess(res, {
    message: "Project updated successfully",
    data: project
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(req.user._id, req.params.id);
  sendSuccess(res, {
    message: "Project deleted successfully",
    data: project
  });
});

const listProjects = asyncHandler(async (req, res) => {
  const result = await projectService.listProjects(req.query);
  sendSuccess(res, {
    message: "Projects fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getSingleProject = asyncHandler(async (req, res) => {
  const project = await projectService.getSingleProject(req.params.id);
  sendSuccess(res, {
    message: "Project fetched successfully",
    data: project
  });
});

const getMyProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getMyCreatedProjects(req.user._id, req.query);
  sendSuccess(res, {
    message: "My projects fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const bookmarkProject = asyncHandler(async (req, res) => {
  const projects = await projectService.bookmarkProject(req.user._id, req.params.id);
  sendSuccess(res, {
    message: "Project bookmarked successfully",
    data: projects
  });
});

const unbookmarkProject = asyncHandler(async (req, res) => {
  const projects = await projectService.unbookmarkProject(req.user._id, req.params.id);
  sendSuccess(res, {
    message: "Project removed from bookmarks",
    data: projects
  });
});

const getSavedProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getSavedProjects(req.user._id);
  sendSuccess(res, {
    message: "Saved projects fetched successfully",
    data: projects
  });
});

const changeProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.changeProjectStatus(
    req.user._id,
    req.params.id,
    req.body.status
  );
  sendSuccess(res, {
    message: "Project status updated successfully",
    data: project
  });
});

const viewMembers = asyncHandler(async (req, res) => {
  const members = await projectService.viewProjectMembers(req.params.id);
  sendSuccess(res, {
    message: "Project members fetched successfully",
    data: members
  });
});

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  listProjects,
  getSingleProject,
  getMyProjects,
  bookmarkProject,
  unbookmarkProject,
  getSavedProjects,
  changeProjectStatus,
  viewMembers
};
