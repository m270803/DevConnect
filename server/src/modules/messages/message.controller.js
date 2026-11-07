
const mongoose = require("mongoose");

const Message = require("./message.model");
const Conversation = require("../conversations/conversation.model");
const { sendMessageSchema } = require("./message.validation");

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// POST /api/messages/:conversationId
async function sendMessage(req, res, next) {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const result = sendMessageSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { clientId: req.user._id },
        { professionalId: req.user._id },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      content: result.data.content,
      readBy: [req.user._id],
    });

    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { lastMessageAt: message.createdAt } }
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/messages/:conversationId?page=1&limit=20
async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { clientId: req.user._id },
        { professionalId: req.user._id },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: conversation._id })
        .populate("senderId", "name username")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversationId: conversation._id }),
    ]);

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendMessage,
  getMessages,
};
