const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const taskService = require("../services/taskService");

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    userId: req.user._id,
    payload: req.body,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Task created successfully",
    data: task
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    userId: req.user._id,
    taskId: req.params.id,
    payload: req.body,
    io: req.app.get("io")
  });

  sendSuccess(res, {
    message: "Task updated successfully",
    data: task
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask({
    userId: req.user._id,
    taskId: req.params.id
  });

  sendSuccess(res, {
    message: "Task deleted successfully",
    data: task
  });
});

const getProjectTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getProjectTasks({
    userId: req.user._id,
    projectId: req.params.projectId,
    query: req.query
  });

  sendSuccess(res, {
    message: "Project tasks fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getMyAssignedTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getMyAssignedTasks(req.user._id, req.query);
  sendSuccess(res, {
    message: "Assigned tasks fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const addTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskService.addTaskComment({
    userId: req.user._id,
    taskId: req.params.id,
    content: req.body.content
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Task comment added successfully",
    data: comment
  });
});

const editTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskService.editTaskComment({
    userId: req.user._id,
    commentId: req.params.commentId,
    content: req.body.content
  });

  sendSuccess(res, {
    message: "Task comment updated successfully",
    data: comment
  });
});

const deleteTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskService.deleteTaskComment({
    userId: req.user._id,
    commentId: req.params.commentId
  });

  sendSuccess(res, {
    message: "Task comment deleted successfully",
    data: comment
  });
});

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getProjectTasks,
  getMyAssignedTasks,
  addTaskComment,
  editTaskComment,
  deleteTaskComment
};
