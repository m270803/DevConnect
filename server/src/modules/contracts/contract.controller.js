
const mongoose = require("mongoose");
const Contract = require("./contract.model");

async function getMyContracts(req, res, next) {
  try {
    const contracts = await Contract.find({
      $or: [
        { clientId: req.user._id },
        { professionalId: req.user._id },
      ],
    })
      .populate("projectId", "title category")
      .populate("proposalId", "proposedPrice deliveryDays status")
      .populate("clientId", "name username avatar")
      .populate("professionalId", "name username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contracts.length,
      contracts,
    });
  } catch (error) {
    next(error);
  }
}

async function getContractById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID",
      });
    }

    const contract = await Contract.findOne({
      _id: req.params.id,
      $or: [
        { clientId: req.user._id },
        { professionalId: req.user._id },
      ],
    })
      .populate("projectId", "title category description")
      .populate("proposalId", "coverLetter proposedPrice deliveryDays status")
      .populate("clientId", "name username avatar")
      .populate("professionalId", "name username avatar");

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    return res.status(200).json({
      success: true,
      contract,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyContracts,
  getContractById,
};
