const express = require("express");

const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  changePasswordValidator
} = require("../validators/authValidator");

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 */
router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.post("/admin/login", loginValidator, validate, authController.adminLogin);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", forgotPasswordValidator, validate, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidator, validate, authController.resetPassword);
router.post("/verify-email", verifyEmailValidator, validate, authController.verifyEmail);
router.post(
  "/resend-verification-otp",
  forgotPasswordValidator,
  validate,
  authController.resendVerificationOtp
);
router.post("/logout", protect, authController.logout);
router.post("/change-password", protect, changePasswordValidator, validate, authController.changePassword);
router.get("/me", protect, authController.me);
router.patch("/deactivate", protect, authController.deactivate);
router.delete("/delete-account", protect, authController.deleteOwnAccount);

module.exports = router;
