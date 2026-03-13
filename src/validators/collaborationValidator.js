const { body } = require("express-validator");
const { objectIdParam } = require("./commonValidator");

const applyValidator = [
  objectIdParam("id"),
  body("message").optional().isString()
];

const invitationValidator = [
  objectIdParam("id"),
  body("invitedUser").isMongoId().withMessage("invitedUser is required"),
  body("message").optional().isString(),
  body("proposedRole").optional().isString()
];

const assignRoleValidator = [
  objectIdParam("id"),
  body("memberUserId").isMongoId().withMessage("memberUserId is required"),
  body("roleName").trim().notEmpty().withMessage("roleName is required")
];

const decisionValidator = [
  objectIdParam("id"),
  objectIdParam("applicationId")
];

const invitationDecisionValidator = [objectIdParam("invitationId")];

const memberActionValidator = [
  objectIdParam("id"),
  body("memberUserId").isMongoId().withMessage("memberUserId is required")
];

module.exports = {
  applyValidator,
  invitationValidator,
  assignRoleValidator,
  decisionValidator,
  invitationDecisionValidator,
  memberActionValidator
};
