const { body, query } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const createTaskValidator = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("project").isMongoId().withMessage("project is required"),
  body("description").optional().isString(),
  body("assignedTo").optional().isArray(),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("dueDate").optional().isISO8601(),
  body("attachments").optional().isArray()
];

const updateTaskValidator = [
  objectIdParam("id"),
  body("title").optional().trim().notEmpty(),
  body("description").optional().isString(),
  body("assignedTo").optional().isArray(),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("progress").optional().isInt({ min: 0, max: 100 }),
  body("dueDate").optional().isISO8601(),
  body("attachments").optional().isArray()
];

const taskCommentValidator = [
  body("content").trim().notEmpty().withMessage("content is required")
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskCommentValidator,
  taskIdValidator: [objectIdParam("id")],
  projectTasksValidator: [objectIdParam("projectId"), ...paginationValidators, query("status").optional().isString()],
  commentIdValidator: [objectIdParam("commentId")]
};
