
const express = require("express");
const router = express.Router();

const authenticate = require("../../middleware/auth.middleware");

const {
  sendMessage,
  getMessages,
} = require("./message.controller");

router.use(authenticate);

router.post("/:conversationId", sendMessage);
router.get("/:conversationId", getMessages);

module.exports = router;
