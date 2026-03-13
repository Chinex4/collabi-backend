const express = require("express");

const fileController = require("../controllers/fileController");
const { protect } = require("../middlewares/authMiddleware");
const { single } = require("../middlewares/uploadMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { fileUploadValidator } = require("../validators/fileValidator");

const router = express.Router();

router.post("/upload", protect, single("file"), fileUploadValidator, validate, fileController.uploadFile);

module.exports = router;
