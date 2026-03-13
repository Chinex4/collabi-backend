const express = require("express");

const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, userController.searchUsers);

module.exports = router;
