const { body, query } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const createProjectValidator = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("description").trim().notEmpty().withMessage("description is required"),
  body("category").isMongoId().withMessage("category is required"),
  body("department").optional().isMongoId(),
  body("faculty").optional().isMongoId(),
  body("requiredSkills").optional().isArray(),
  body("optionalSkills").optional().isArray(),
  body("maxTeamSize").isInt({ min: 1, max: 20 }).withMessage("maxTeamSize must be between 1 and 20"),
  body("deadline").optional().isISO8601().withMessage("deadline must be a valid date"),
  body("visibility").optional().isIn(["public", "private", "department_only"])
];

const updateProjectValidator = [
  objectIdParam("id"),
  body("title").optional().trim().notEmpty(),
  body("description").optional().trim().notEmpty(),
  body("category").optional().isMongoId(),
  body("maxTeamSize").optional().isInt({ min: 1, max: 20 }),
  body("deadline").optional().isISO8601(),
  body("status").optional().isIn(["open", "in_progress", "completed", "cancelled", "closed"]),
  body("visibility").optional().isIn(["public", "private", "department_only"])
];

const listProjectsValidator = [
  ...paginationValidators,
  query("category").optional().isMongoId(),
  query("department").optional().isMongoId(),
  query("requiredSkill").optional().isMongoId(),
  query("status").optional().isIn(["open", "in_progress", "completed", "cancelled", "closed"])
];

const projectStatusValidator = [
  objectIdParam("id"),
  body("status")
    .isIn(["open", "in_progress", "completed", "cancelled", "closed"])
    .withMessage("status is invalid")
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  listProjectsValidator,
  projectStatusValidator,
  projectIdValidator: [objectIdParam("id")]
};
