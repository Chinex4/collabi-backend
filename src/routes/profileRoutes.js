const express = require("express");

const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  updateProfileValidator,
  searchProfilesValidator,
  publicProfileValidator
} = require("../validators/profileValidator");

const router = express.Router();

router.get("/", searchProfilesValidator, validate, profileController.searchProfiles);
router.get("/me", protect, profileController.getMyProfile);
router.patch("/me", protect, updateProfileValidator, validate, profileController.updateMyProfile);
router.get("/:id", publicProfileValidator, validate, profileController.getPublicProfile);

module.exports = router;
