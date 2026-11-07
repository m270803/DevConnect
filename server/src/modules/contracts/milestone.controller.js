
const mongoose = require("mongoose");
const Milestone = require("./milestone.model");
const Contract = require("../contracts/contract.model");

async function createMilestone(req, res, next) {
  try {
    const { contractId } = req.params;
    const { title, description, amount, dueDate, order } = req.body;

    if (!mongoose.isValidObjectId(contractId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID",
      });
    }

    if (
      !title?.trim() ||
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !dueDate ||
      !Number.isInteger(Number(order)) ||
      Number(order) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid title, positive amount, due date and order are required",
      });
    }

    const parsedDate = new Date(dueDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be in the future",
      });
    }

    const contract = await Contract.findById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    if (String(contract.clientId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the contract client can create milestones",
      });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Milestones can only be created for active contracts",
      });
    }

    const existingMilestones = await Milestone.find({ contractId });

    const allocatedAmount = existingMilestones.reduce(
      (total, milestone) => total + milestone.amount,
      0
    );

    if (allocatedAmount + Number(amount) > contract.agreedPrice) {
      return res.status(400).json({
        success: false,
        message: "Total milestone amounts cannot exceed the contract price",
        remainingAmount: contract.agreedPrice - allocatedAmount,
      });
    }

    if (existingMilestones.some(
      (milestone) => milestone.order === Number(order)
    )) {
      return res.status(409).json({
        success: false,
        message: "A milestone with this order already exists",
      });
    }

    const milestone = await Milestone.create({
      contractId,
      title: title.trim(),
      description,
      amount: Number(amount),
      dueDate: parsedDate,
      order: Number(order),
    });

    return res.status(201).json({
      success: true,
      message: "Milestone created successfully",
      milestone,
    });
  } catch (error) {
    next(error);
  }
}

async function getContractMilestones(req, res, next) {
  try {
    const { contractId } = req.params;

    if (!mongoose.isValidObjectId(contractId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID",
      });
    }

    const contract = await Contract.findById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const isParticipant =
      String(contract.clientId) === String(req.user._id) ||
      String(contract.professionalId) === String(req.user._id);

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot view these milestones",
      });
    }

    const milestones = await Milestone.find({ contractId }).sort({
      order: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: milestones.length,
      milestones,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMilestoneStatus(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const { status, deliverableUrl, submissionNote, revisionNote } = req.body;

    if (!mongoose.isValidObjectId(milestoneId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone ID",
      });
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    const contract = await Contract.findById(milestone.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Associated contract not found",
      });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This contract is not active",
      });
    }

    const isClient =
      String(contract.clientId) === String(req.user._id);
    const isProfessional =
      String(contract.professionalId) === String(req.user._id);

    if (!isClient && !isProfessional) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this milestone",
      });
    }

    if (isProfessional) {
      if (status === "in_progress" && milestone.status === "pending") {
        milestone.status = "in_progress";
      } else if (
        status === "submitted" &&
        ["in_progress", "revision_requested"].includes(milestone.status)
      ) {
        if (!deliverableUrl?.trim()) {
          return res.status(400).json({
            success: false,
            message: "A deliverable URL is required when submitting work",
          });
        }

        milestone.status = "submitted";
        milestone.deliverableUrl = deliverableUrl.trim();
        milestone.submissionNote = submissionNote?.trim() || "";
        milestone.submittedAt = new Date();
        milestone.revisionNote = "";
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition for a professional",
        });
      }
    } else {
      if (status === "approved" && milestone.status === "submitted") {
        milestone.status = "approved";
        milestone.approvedAt = new Date();
      } else if (
        status === "revision_requested" &&
        milestone.status === "submitted"
      ) {
        if (!revisionNote?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Please provide a revision note",
          });
        }

        milestone.status = "revision_requested";
        milestone.revisionNote = revisionNote.trim();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition for a client",
        });
      }
    }

    await milestone.save();

    return res.status(200).json({
      success: true,
      message: "Milestone updated successfully",
      milestone,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMilestone,
  getContractMilestones,
  updateMilestoneStatus,
};
