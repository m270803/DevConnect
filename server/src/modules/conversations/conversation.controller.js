
const mongoose = require("mongoose");

const Conversation = require("./conversation.model");
const Proposal = require("../proposals/proposal.model");
const Contract = require("../contracts/contract.model");

async function createConversation(req, res, next) {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can start conversations",
      });
    }

    const { projectId, professionalId } = req.body;

    if (
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(professionalId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid projectId and professionalId are required",
      });
    }

    // A professional must have submitted a proposal
    // for this client's project.
    const proposal = await Proposal.findOne({
      projectId,
      professionalId,
      clientId: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });

    if (!proposal) {
      return res.status(403).json({
        success: false,
        message:
          "You can only message a professional who has submitted an active or accepted proposal for your project",
      });
    }

    const contract = await Contract.findOne({
  projectId,
  clientId: req.user._id,
  professionalId,
});

if (!contract) {
  return res.status(403).json({
    success: false,
    message: "You can start this conversation only after a contract exists",
  });
}

    let conversation = await Conversation.findOne({
      projectId,
      clientId: req.user._id,
      professionalId,
    });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          projectId,
          clientId: req.user._id,
          professionalId,
        });
      } catch (error) {
        // Handle two requests creating the same conversation
        // at nearly the same time.
        if (error.code !== 11000) {
          throw error;
        }

        conversation = await Conversation.findOne({
          projectId,
          clientId: req.user._id,
          professionalId,
        });

        if (!conversation) {
          throw error;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      conversation,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({
      $or: [
        { clientId: req.user._id },
        { professionalId: req.user._id },
      ],
    })
      .populate("projectId", "title category status")
      .populate("clientId", "name username")
      .populate("professionalId", "name username")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createConversation,
  getMyConversations,
};
