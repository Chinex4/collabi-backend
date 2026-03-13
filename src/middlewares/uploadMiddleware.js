const upload = require("../utils/fileUpload");

module.exports = {
  single: (fieldName) => upload.single(fieldName),
  array: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount)
};
