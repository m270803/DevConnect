
const express = require("express");
const router = express.Router();

const authenticate = require("../../middleware/auth.middleware");

const {
  createMilestone,
  getContractMilestones,
  updateMilestoneStatus,
} = require("./milestone.controller");

router.use(authenticate);

// Create a milestone for a contract
router.post("/contract/:contractId", createMilestone);

// Get all milestones belonging to a contract
router.get("/contract/:contractId", getContractMilestones);

// Update a milestone's status
router.patch("/:milestoneId/status", updateMilestoneStatus);

module.exports = router;
