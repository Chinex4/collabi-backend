const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const fileService = require("../services/fileService");
const profileService = require("../services/profileService");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

const uploadFile = asyncHandler(async (req, res) => {
  const file = await fileService.uploadSingleFile({
    file: req.file,
    userId: req.user._id,
    contextType: req.body.contextType,
    contextId: req.body.contextId,
    folder: `student-collab/${req.body.contextType || "general"}`
  });

  if (req.body.contextType === "project" && req.body.contextId) {
    await Project.findByIdAndUpdate(req.body.contextId, {
      $push: { attachments: { file: file._id, label: req.body.label || file.originalName } }
    });
  }

  if (req.body.contextType === "task" && req.body.contextId) {
    await Task.findByIdAndUpdate(req.body.contextId, {
      $addToSet: { attachments: file._id }
    });
  }

  if (req.body.contextType === "profile") {
    await User.findByIdAndUpdate(req.user._id, {
      profileImage: { url: file.url, publicId: file.publicId }
    });
    await profileService.updateMyProfile(req.user._id, {
      profilePicture: { url: file.url, publicId: file.publicId }
    });
  }

  sendSuccess(res, {
    statusCode: 201,
    message: "File uploaded successfully",
    data: file
  });
});

module.exports = {
  uploadFile
};
