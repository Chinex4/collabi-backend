const { StatusCodes } = require("http-status-codes");

const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { createNotification, notifyMany } = require("./notificationService");
const { ensureProjectMember, getProjectOrThrow } = require("./projectAccessService");
const { NOTIFICATION_TYPE } = require("../constants/enums");

const taskPopulate = [
  { path: "project", select: "title owner" },
  { path: "createdBy", select: "fullName email" },
  { path: "assignedTo", select: "fullName email profileImage" },
  { path: "attachments" }
];

const createTask = async ({ userId, payload, io }) => {
  await ensureProjectMember(payload.project, userId);
  await getProjectOrThrow(payload.project);

  const task = await Task.create({
    ...payload,
    createdBy: userId,
    activityLog: [
      {
        action: "task_created",
        actor: userId,
        note: "Task created"
      }
    ]
  });

  if (payload.assignedTo?.length) {
    await notifyMany(
      {
        recipients: payload.assignedTo,
        sender: userId,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: "New task assigned",
        message: `You have been assigned to task: ${payload.title}`,
        data: { taskId: task._id, projectId: payload.project }
      },
      io
    );
  }

  return Task.findById(task._id).populate(taskPopulate);
};

const updateTask = async ({ userId, taskId, payload, io }) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Task not found");
  }

  await ensureProjectMember(task.project, userId);

  Object.assign(task, payload);
  task.activityLog.push({
    action: "task_updated",
    actor: userId,
    note: "Task details updated"
  });
  await task.save();

  if (task.assignedTo?.length) {
    await notifyMany(
      {
        recipients: task.assignedTo,
        sender: userId,
        type: NOTIFICATION_TYPE.TASK_UPDATED,
        title: "Task updated",
        message: `Task updated: ${task.title}`,
        data: { taskId: task._id, projectId: task.project }
      },
      io
    );
  }

  return Task.findById(task._id).populate(taskPopulate);
};

const deleteTask = async ({ userId, taskId }) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Task not found");
  }

  await ensureProjectMember(task.project, userId);
  task.isDeleted = true;
  task.activityLog.push({
    action: "task_deleted",
    actor: userId,
    note: "Task deleted"
  });
  await task.save();

  return task;
};

const getProjectTasks = async ({ userId, projectId, query = {} }) => {
  await ensureProjectMember(projectId, userId);
  const { page, limit, skip } = buildPagination(query);
  const filters = { project: projectId, isDeleted: false };

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;

  const [items, total] = await Promise.all([
    Task.find(filters).populate(taskPopulate).sort("dueDate -createdAt").skip(skip).limit(limit),
    Task.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getMyAssignedTasks = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { assignedTo: userId, isDeleted: false };

  if (query.status) filters.status = query.status;

  const [items, total] = await Promise.all([
    Task.find(filters).populate(taskPopulate).sort("dueDate -createdAt").skip(skip).limit(limit),
    Task.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const addTaskComment = async ({ userId, taskId, content }) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Task not found");
  }

  await ensureProjectMember(task.project, userId);

  const comment = await TaskComment.create({
    task: taskId,
    user: userId,
    content
  });

  task.activityLog.push({
    action: "task_comment_added",
    actor: userId,
    note: "Added a task comment"
  });
  await task.save();

  return comment.populate("user", "fullName email");
};

const editTaskComment = async ({ userId, commentId, content }) => {
  const comment = await TaskComment.findById(commentId).populate("task");

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  if (String(comment.user) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the comment author can edit this comment");
  }

  comment.content = content;
  comment.editedAt = new Date();
  await comment.save();

  return comment.populate("user", "fullName email");
};

const deleteTaskComment = async ({ userId, commentId }) => {
  const comment = await TaskComment.findById(commentId);

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  if (String(comment.user) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the comment author can delete this comment");
  }

  await comment.deleteOne();
  return comment;
};

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
