
const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "submitted",
        "revision_requested",
        "approved",
      ],
      default: "pending",
      index: true,
    },

    deliverableUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },

    submissionNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    revisionNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

milestoneSchema.index(
  { contractId: 1, order: 1 },
  { unique: true }
);

module.exports = mongoose.model("Milestone", milestoneSchema);
