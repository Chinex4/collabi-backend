const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const lookupService = require("../services/lookupService");

const createLookupController = (Model, options = {}) => ({
  list: asyncHandler(async (req, res) => {
    const result = await lookupService.listLookups(Model, req.query, options.populate);
    sendSuccess(res, {
      message: `${options.label || "Resources"} fetched successfully`,
      data: result.items,
      meta: result.meta
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await lookupService.getLookupById(Model, req.params.id, options.populate);
    sendSuccess(res, {
      message: `${options.singleLabel || "Resource"} fetched successfully`,
      data: item
    });
  }),

  create: asyncHandler(async (req, res) => {
    const item = await lookupService.createLookup(Model, req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: `${options.singleLabel || "Resource"} created successfully`,
      data: item
    });
  }),

  update: asyncHandler(async (req, res) => {
    const item = await lookupService.updateLookup(Model, req.params.id, req.body);
    sendSuccess(res, {
      message: `${options.singleLabel || "Resource"} updated successfully`,
      data: item
    });
  }),

  remove: asyncHandler(async (req, res) => {
    const item = await lookupService.deleteLookup(Model, req.params.id);
    sendSuccess(res, {
      message: `${options.singleLabel || "Resource"} deleted successfully`,
      data: item
    });
  })
});

module.exports = createLookupController;
