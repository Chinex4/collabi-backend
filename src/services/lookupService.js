const { StatusCodes } = require("http-status-codes");

const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { buildSearchRegex } = require("../utils/queryBuilder");

const listLookups = async (Model, query = {}, populate = "") => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.search) {
    filters.name = buildSearchRegex(query.search);
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const [items, total] = await Promise.all([
    Model.find(filters).populate(populate).sort("name").skip(skip).limit(limit),
    Model.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getLookupById = async (Model, id, populate = "") => {
  const item = await Model.findById(id).populate(populate);

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  return item;
};

const createLookup = async (Model, payload) => Model.create(payload);

const updateLookup = async (Model, id, payload) => {
  const item = await Model.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  return item;
};

const deleteLookup = async (Model, id) => {
  const item = await Model.findByIdAndDelete(id);

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  return item;
};

module.exports = {
  listLookups,
  getLookupById,
  createLookup,
  updateLookup,
  deleteLookup
};
