const express = require("express");

const reportController = require("../controllers/reportController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { createReportValidator, listReportsValidator } = require("../validators/reportValidator");

const router = express.Router();

router.use(protect);

router.post("/", createReportValidator, validate, reportController.createReport);
router.get("/", listReportsValidator, validate, reportController.getMyReports);

module.exports = router;
