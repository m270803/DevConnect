
const express = require("express");
const router = express.Router();

const authenticate = require("../../middleware/auth.middleware");

const {
  createConversation,
  getMyConversations,
} = require("./conversation.controller");

router.use(authenticate);

router.post("/", createConversation);
router.get("/mine", getMyConversations);

module.exports = router;
