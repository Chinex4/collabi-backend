const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../config/cloudinary");

const uploadBuffer = async ({ buffer, folder, resourceType = "auto", originalname }) => {
  const sanitizedName = originalname.replace(/\s+/g, "-");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${uuidv4()}-${sanitizedName}`,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

const deleteAsset = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  uploadBuffer,
  deleteAsset
};
