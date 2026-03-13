const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const userService = require("../services/userService");

const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query);
  sendSuccess(res, {
    message: "Users fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

module.exports = {
  searchUsers
};
