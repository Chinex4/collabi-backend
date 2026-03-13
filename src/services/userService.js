const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const { buildMeta, buildPagination } = require("../utils/pagination");
const { buildSearchRegex, buildSort } = require("../utils/queryBuilder");

const searchUsers = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = { isDeleted: false };

  if (query.role) filters.role = query.role;
  if (query.department) filters.department = query.department;
  if (query.isActive !== undefined) filters.isActive = query.isActive === "true";
  if (query.search) {
    filters.$or = [
      { fullName: buildSearchRegex(query.search) },
      { email: buildSearchRegex(query.search) }
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filters)
      .populate("faculty department", "name")
      .sort(buildSort(query.sortBy, "-createdAt"))
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters)
  ]);

  return {
    items,
    meta: buildMeta({ page, limit, total })
  };
};

const getUserActivitySummary = async (userId) => {
  const [profile, user] = await Promise.all([
    StudentProfile.findOne({ user: userId }),
    User.findById(userId).select("lastSeen lastLoginAt isSuspended isActive")
  ]);

  return {
    profile,
    lastSeen: user?.lastSeen,
    lastLoginAt: user?.lastLoginAt,
    isSuspended: user?.isSuspended,
    isActive: user?.isActive
  };
};

module.exports = {
  searchUsers,
  getUserActivitySummary
};
