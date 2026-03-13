const { StatusCodes } = require("http-status-codes");

const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { buildSearchRegex } = require("../utils/queryBuilder");

const profilePopulate = [
  { path: "user", select: "fullName email role profileImage department faculty level" },
  { path: "faculty", select: "name" },
  { path: "department", select: "name faculty", populate: { path: "faculty", select: "name" } },
  { path: "skills.skill", select: "name" },
  { path: "interests", select: "name" },
  { path: "projectPreferences.categories", select: "name" }
];

const getMyProfile = async (userId) => {
  const profile = await StudentProfile.findOne({ user: userId }).populate(profilePopulate);

  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  return profile;
};

const updateMyProfile = async (userId, payload) => {
  const profile = await StudentProfile.findOneAndUpdate({ user: userId }, payload, {
    new: true,
    runValidators: true
  }).populate(profilePopulate);

  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  const userUpdates = {};
  ["fullName", "department", "faculty", "level"].forEach((field) => {
    if (payload[field] !== undefined) {
      userUpdates[field] = payload[field];
    }
  });

  if (Object.keys(userUpdates).length) {
    await User.findByIdAndUpdate(userId, userUpdates);
  }

  return profile;
};

const searchProfiles = async (query) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.department) filters.department = query.department;
  if (query.faculty) filters.faculty = query.faculty;
  if (query.availability) filters.availability = query.availability;
  if (query.interest) filters.interests = query.interest;
  if (query.skill) filters["skills.skill"] = query.skill;
  if (query.visibility) filters.visibility = query.visibility;
  else filters.visibility = { $ne: "private" };

  if (query.search) {
    filters.$or = [{ bio: buildSearchRegex(query.search) }];
  }

  const [items, total] = await Promise.all([
    StudentProfile.find(filters)
      .populate(profilePopulate)
      .sort("-updatedAt")
      .skip(skip)
      .limit(limit),
    StudentProfile.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getPublicProfile = async (profileId) => {
  const profile = await StudentProfile.findById(profileId).populate(profilePopulate);

  if (!profile || profile.visibility === "private") {
    throw new ApiError(StatusCodes.NOT_FOUND, "Public profile not found");
  }

  return profile;
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  searchProfiles,
  getPublicProfile
};
