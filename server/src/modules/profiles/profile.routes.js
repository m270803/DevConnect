
const express = require("express");
const controller = require("./profile.controller");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/authorize.middleware");
const {
  doubleCsrfProtection,
} = require("../../middleware/cookieSecurity.middleware");

const router = express.Router();

router.get("/me", authenticate, authorize("professional"), controller.getMyProfile);

router.put(
  "/me",
  authenticate,
  authorize("professional"),
  doubleCsrfProtection,
  controller.createOrUpdateProfile
);

router.get("/:userId", controller.getPublicProfile);

module.exports = router;
