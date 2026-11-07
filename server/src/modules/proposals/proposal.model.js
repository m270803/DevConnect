
const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverLetter: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 3000,
    },

    proposedPrice: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      required: true,
    },

    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate applications to the same project.
proposalSchema.index(
  { projectId: 1, professionalId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
