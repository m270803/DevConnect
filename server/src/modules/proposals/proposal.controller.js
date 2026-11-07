
const mongoose = require("mongoose");
const Proposal = require("./proposal.model");
const Project = require("../projects/project.model");
const Contract = require("../contracts/contract.model");
const Conversation = require("../conversations/conversation.model");

const {
  proposalSchema,
  decisionSchema,
} = require("./proposal.validation");

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues,
  });
}

// Professional submits a proposal
async function createProposal(req, res, next) {
  try {
    const result = proposalSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const { projectId, coverLetter, proposedPrice, deliveryDays } =
      result.data;

    const project = await Project.findOne({
      _id: projectId,
      status: "open",
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Open project not found",
      });
    }

    if (project.clientId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot apply to your own project",
      });
    }

    const proposal = await Proposal.create({
      projectId: project._id,
      professionalId: req.user._id,
      clientId: project.clientId,
      coverLetter,
      proposedPrice,
      deliveryDays,
      currency: project.currency,
    });

    return res.status(201).json({
      success: true,
      message: "Proposal submitted successfully",
      proposal,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this project",
      });
    }

    next(error);
  }
}

// Professional views their own proposals
async function getMyProposals(req, res, next) {
  try {
    const proposals = await Proposal.find({
      professionalId: req.user._id,
    })
      .populate("projectId", "title category status budgetMin budgetMax currency")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    next(error);
  }
}

// Client views proposals for a project they own
async function getProjectProposals(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      clientId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not own it",
      });
    }

    const proposals = await Proposal.find({ projectId })
      .populate("professionalId", "name username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    next(error);
  }
}

// Client accepts or rejects a proposal

async function decideProposal(req, res, next) {
  const mongoose = require("mongoose");

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    const result = decisionSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const proposal = await Proposal.findOne({
      _id: req.params.id,
      clientId: req.user._id,
      status: "pending",
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Pending proposal not found for your projects",
      });
    }

    // Rejecting does not require a contract.
    if (result.data.action === "reject") {
      const rejected = await Proposal.findOneAndUpdate(
        {
          _id: proposal._id,
          clientId: req.user._id,
          status: "pending",
        },
        { $set: { status: "rejected" } },
        { new: true }
      );

      if (!rejected) {
        return res.status(409).json({
          success: false,
          message: "Proposal status has already changed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Proposal rejected",
        proposal: rejected,
      });
    }

    const session = await mongoose.startSession();
    let createdContract;
    let createdConversationId;

    try {
      await session.withTransaction(async () => {
        const currentProposal = await Proposal.findOne({
          _id: proposal._id,
          clientId: req.user._id,
          status: "pending",
        }).session(session);

        if (!currentProposal) {
          throw new Error("PROPOSAL_NO_LONGER_PENDING");
        }

        const project = await Project.findOneAndUpdate(
          {
            _id: currentProposal.projectId,
            clientId: req.user._id,
            status: "open",
          },
          { $set: { status: "closed" } },
          { new: true, session }
        );

        if (!project) {
          throw new Error("PROJECT_NO_LONGER_OPEN");
        }

        const accepted = await Proposal.findOneAndUpdate(
          {
            _id: currentProposal._id,
            clientId: req.user._id,
            status: "pending",
          },
          { $set: { status: "accepted" } },
          { new: true, session }
        );

        if (!accepted) {
          throw new Error("PROPOSAL_NO_LONGER_PENDING");
        }

        const startDate = new Date();
        const expectedEndDate = new Date(startDate);
        expectedEndDate.setDate(
          expectedEndDate.getDate() + accepted.deliveryDays
        );

        const contracts = await Contract.create(
          [
            {
              projectId: project._id,
              proposalId: accepted._id,
              clientId: project.clientId,
              professionalId: accepted.professionalId,
              title: project.title,
              agreedPrice: accepted.proposedPrice,
              currency: accepted.currency,
              deliveryDays: accepted.deliveryDays,
              startDate,
              expectedEndDate,
              status: "active",
            },
          ],
          { session }
        );

        createdContract = contracts[0];

const conversations = await Conversation.findOneAndUpdate(
  {
    projectId: project._id,
    clientId: project.clientId,
    professionalId: accepted.professionalId,
  },
  {
    $setOnInsert: {
      projectId: project._id,
      clientId: project.clientId,
      professionalId: accepted.professionalId,
    },
  },
  {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    session,
  }
);

createdConversationId = conversations._id;

        await Proposal.updateMany(
          {
            projectId: project._id,
            _id: { $ne: accepted._id },
            status: "pending",
          },
          { $set: { status: "rejected" } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

return res.status(200).json({
  success: true,
  message: "Proposal accepted, contract created, and conversation ready",
  proposalId: proposal._id,
  contract: createdContract,
  conversationId: createdConversationId,
});
  } catch (error) {
    if (
      error.message === "PROPOSAL_NO_LONGER_PENDING" ||
      error.message === "PROJECT_NO_LONGER_OPEN"
    ) {
      return res.status(409).json({
        success: false,
        message: "The proposal or project is no longer available",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A contract already exists for this proposal",
      });
    }

    next(error);
  }
}


// Professional withdraws their own pending proposal
async function withdrawProposal(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    const proposal = await Proposal.findOneAndUpdate(
      {
        _id: req.params.id,
        professionalId: req.user._id,
        status: "pending",
      },
      { $set: { status: "withdrawn" } },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Pending proposal not found or you do not own it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Proposal withdrawn successfully",
      proposal,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProposal,
  getMyProposals,
  getProjectProposals,
  decideProposal,
  withdrawProposal,
};
