const mongoose = require("mongoose");

const Message = require("../models/Message");
const Project = require("../models/Project");
const ProjectApplication = require("../models/ProjectApplication");
const ProjectMember = require("../models/ProjectMember");
const StudentProfile = require("../models/StudentProfile");
const Task = require("../models/Task");
const User = require("../models/User");
const { USER_ROLES } = require("../constants/enums");

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const groupByDate = (dateField) => ({
  $dateToString: {
    format: "%Y-%m-%d",
    date: `$${dateField}`
  }
});

const getAdminAnalytics = async () => {
  const [totalUsers, totalStudents, totalAdmins, active7, active30, totalProjects, openProjects, completedProjects, totalTeams] =
    await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: USER_ROLES.STUDENT, isDeleted: false }),
      User.countDocuments({ role: USER_ROLES.ADMIN, isDeleted: false }),
      User.countDocuments({ lastSeen: { $gte: daysAgo(7) }, isDeleted: false }),
      User.countDocuments({ lastSeen: { $gte: daysAgo(30) }, isDeleted: false }),
      Project.countDocuments({ isDeleted: false }),
      Project.countDocuments({ status: "open", isDeleted: false }),
      Project.countDocuments({ status: "completed", isDeleted: false }),
      ProjectMember.distinct("project").then((items) => items.length)
    ]);

  const [
    projectsOverTime,
    projectsByCategory,
    applicationsPerProject,
    applicationDecisions,
    mostCommonSkills,
    taskCompletionRate,
    messagesOverTime,
    topActiveProjects,
    topActiveStudents
  ] = await Promise.all([
    Project.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: groupByDate("createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Project.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
    ]),
    ProjectApplication.aggregate([
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" }
    ]),
    ProjectApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    StudentProfile.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills.skill", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "skills",
          localField: "_id",
          foreignField: "_id",
          as: "skill"
        }
      },
      { $unwind: { path: "$skill", preserveNullAndEmptyArrays: true } }
    ]),
    Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Message.aggregate([
      { $group: { _id: groupByDate("createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Message.aggregate([
      { $match: { project: { $exists: true, $ne: null } } },
      { $group: { _id: "$project", messages: { $sum: 1 } } },
      { $sort: { messages: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" }
    ]),
    Message.aggregate([
      { $group: { _id: "$sender", messages: { $sum: 1 } } },
      { $sort: { messages: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ])
  ]);

  return {
    overview: {
      totalUsers,
      totalStudents,
      totalAdmins,
      activeUsers7Days: active7,
      activeUsers30Days: active30,
      totalProjects,
      openProjects,
      completedProjects,
      totalTeams
    },
    charts: {
      projectsOverTime,
      projectsByCategory,
      applicationsPerProject,
      applicationDecisions,
      mostCommonSkills,
      taskCompletionRate,
      messagesOverTime,
      topActiveProjects,
      topActiveStudents
    }
  };
};

module.exports = {
  getAdminAnalytics
};
