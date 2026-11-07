
const express = require("express");
const router = express.Router();

const {
  createProject,
  getMyProjects,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("./project.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/authorize.middleware");

// Public routes
router.get("/", getProjects);

// Client-only routes
router.get(
  "/mine",
  authenticate,
  authorize("client"),
  getMyProjects
);

router.get("/:id", authenticate.optional, getProjectById);

router.post(
  "/",
  authenticate,
  authorize("client"),
  createProject
);

router.patch(
  "/:id",
  authenticate,
  authorize("client"),
  updateProject
);

router.delete(
  "/:id",
  authenticate,
  authorize("client"),
  deleteProject
);

module.exports = router;
