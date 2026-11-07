
const express = require("express");
const controller = require("./user.controller");
const {
  doubleCsrfProtection,
} = require("../../middleware/cookieSecurity.middleware");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/authorize.middleware");

const {
  registerLimiter,
  loginLimiter,
} = require("../../middleware/rateLimit.middleware");

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  doubleCsrfProtection,
  controller.register
);

router.post(
  "/login",
  loginLimiter,
  doubleCsrfProtection,
  controller.login
);

router.post(
  "/logout",
  authenticate,
  doubleCsrfProtection,
  controller.logout
);
router.get("/me", authenticate, controller.getMe);

router.get(
  "/admin/dashboard",
  authenticate,
  authorize("admin"),
  controller.getAdminDashboard
);

module.exports = router;
