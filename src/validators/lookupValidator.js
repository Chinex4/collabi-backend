const { body } = require("express-validator");
const { objectIdParam, paginationValidators } = require("./commonValidator");

const createLookupValidator = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("description").optional().isString(),
  body("faculty").optional().isMongoId()
];

const updateLookupValidator = [
  objectIdParam("id"),
  body("name").optional().trim().notEmpty(),
  body("description").optional().isString(),
  body("faculty").optional().isMongoId(),
  body("isActive").optional().isBoolean()
];

module.exports = {
  createLookupValidator,
  updateLookupValidator,
  listLookupValidator: paginationValidators,
  idLookupValidator: [objectIdParam("id")]
};
