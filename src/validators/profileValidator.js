const { body, query } = require("express-validator");
const { paginationValidators, objectIdParam } = require("./commonValidator");

const updateProfileValidator = [
  body("bio").optional().isString(),
  body("faculty").optional().isMongoId(),
  body("department").optional().isMongoId(),
  body("level").optional().isInt({ min: 100, max: 800 }),
  body("skills").optional().isArray(),
  body("interests").optional().isArray(),
  body("availability").optional().isIn(["available", "busy", "unavailable"]),
  body("preferredRoles").optional().isArray(),
  body("portfolioLinks.github").optional().isURL(),
  body("portfolioLinks.linkedin").optional().isURL(),
  body("portfolioLinks.portfolio").optional().isURL(),
  body("visibility").optional().isIn(["public", "private", "department_only"])
];

const searchProfilesValidator = [
  ...paginationValidators,
  query("department").optional().isMongoId(),
  query("faculty").optional().isMongoId(),
  query("skill").optional().isMongoId(),
  query("interest").optional().isMongoId()
];

module.exports = {
  updateProfileValidator,
  searchProfilesValidator,
  publicProfileValidator: [objectIdParam("id")]
};
