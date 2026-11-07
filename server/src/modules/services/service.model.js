
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    professionalId: {
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
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 3000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 20,
        message: "Maximum 20 skills allowed",
      },
    },

    pricingType: {
      type: String,
      enum: ["fixed", "hourly"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },

    deliveryDays: {
      type: Number,
      min: 1,
      max: 365,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "published", "paused"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

serviceSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model("Service", serviceSchema);
