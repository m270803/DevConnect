
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 5000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 20,
        message: "Maximum 20 skills allowed",
      },
    },

    budgetType: {
      type: String,
      enum: ["fixed", "hourly"],
      required: true,
    },

    budgetMin: {
      type: Number,
      required: true,
      min: 1,
    },

    budgetMax: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },

    deadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "open", "paused", "closed"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

projectSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
