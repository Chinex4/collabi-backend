const { StatusCodes } = require("http-status-codes");

const FileResource = require("../models/FileResource");
const ApiError = require("../utils/ApiError");
const { uploadBuffer } = require("../utils/cloudinary");

const ensureCloudinaryConfigured = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cloudinary credentials are not configured. Update your environment variables first."
    );
  }
};

const uploadSingleFile = async ({
  file,
  userId,
  contextType = "general",
  contextId,
  folder = "student-collab/general"
}) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No file uploaded");
  }

  ensureCloudinaryConfigured();

  const result = await uploadBuffer({
    buffer: file.buffer,
    folder,
    originalname: file.originalname
  });

  return FileResource.create({
    uploader: userId,
    contextType,
    contextId,
    originalName: file.originalname,
    folder,
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    size: file.size,
    resourceType: result.resource_type
  });
};

module.exports = {
  uploadSingleFile
};
