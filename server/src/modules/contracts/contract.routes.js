
const express = require("express");
const router = express.Router();

const {
  getMyContracts,
  getContractById,
} = require("./contract.controller");

const authenticate = require("../../middleware/auth.middleware");

router.use(authenticate);

router.get("/mine", getMyContracts);
router.get("/:id", getContractById);

module.exports = router;
