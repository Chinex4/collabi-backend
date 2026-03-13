const express = require("express");

const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  createTaskValidator,
  updateTaskValidator,
  taskCommentValidator,
  taskIdValidator,
  projectTasksValidator,
  commentIdValidator
} = require("../validators/taskValidator");

const router = express.Router();

router.use(protect);

router.post("/", createTaskValidator, validate, taskController.createTask);
router.get("/my-assigned", taskController.getMyAssignedTasks);
router.get("/project/:projectId", projectTasksValidator, validate, taskController.getProjectTasks);
router.patch("/:id", updateTaskValidator, validate, taskController.updateTask);
router.delete("/:id", taskIdValidator, validate, taskController.deleteTask);
router.post("/:id/comments", taskIdValidator, taskCommentValidator, validate, taskController.addTaskComment);
router.patch(
  "/comments/:commentId",
  commentIdValidator,
  taskCommentValidator,
  validate,
  taskController.editTaskComment
);
router.delete("/comments/:commentId", commentIdValidator, validate, taskController.deleteTaskComment);

module.exports = router;
