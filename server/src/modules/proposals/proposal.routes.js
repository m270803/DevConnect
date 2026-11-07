
const express = require("express");
const router = express.Router();

const {
  createProposal,
  getMyProposals,
  getProjectProposals,
  decideProposal,
  withdrawProposal,
} = require("./proposal.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/authorize.middleware");

// All proposal endpoints require authentication.
router.use(authenticate);

// Professional routes
router.post(
  "/",
  authorize("professional"),
  createProposal
);

router.get(
  "/mine",
  authorize("professional"),
  getMyProposals
);

router.patch(
  "/:id/withdraw",
  authorize("professional"),
  withdrawProposal
);

// Client routes
router.get(
  "/project/:projectId",
  authorize("client"),
  getProjectProposals
);

router.patch(
  "/:id/decision",
  authorize("client"),
  decideProposal
);

module.exports = router;
