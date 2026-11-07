
const express = require("express");
const router = express.Router();

const {
  createService,
  getMyServices,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} = require("./service.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/authorize.middleware");
const {
  doubleCsrfProtection,
} = require("../../middleware/cookieSecurity.middleware");

// Public routes
router.get("/", getServices);

// Protected route must come before /:id
router.get(
  "/mine",
  authenticate,
  authorize("professional"),
  getMyServices
);

router.get("/:id", getServiceById);

// Protected professional actions
router.post(
  "/",
  authenticate,
  authorize("professional"),
  doubleCsrfProtection,
  createService
);

router.patch(
  "/:id",
  authenticate,
  authorize("professional"),
  doubleCsrfProtection,
  updateService
);

router.delete(
  "/:id",
  authenticate,
  authorize("professional"),
  doubleCsrfProtection,
  deleteService
);

module.exports = router;
