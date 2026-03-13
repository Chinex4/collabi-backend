const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const profileService = require("../services/profileService");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user._id);
  sendSuccess(res, {
    message: "Profile fetched successfully",
    data: profile
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateMyProfile(req.user._id, req.body);
  sendSuccess(res, {
    message: "Profile updated successfully",
    data: profile
  });
});

const searchProfiles = asyncHandler(async (req, res) => {
  const result = await profileService.searchProfiles(req.query);
  sendSuccess(res, {
    message: "Profiles fetched successfully",
    data: result.items,
    meta: result.meta
  });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getPublicProfile(req.params.id);
  sendSuccess(res, {
    message: "Public profile fetched successfully",
    data: profile
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  searchProfiles,
  getPublicProfile
};
