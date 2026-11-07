
const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    projectUrl: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const professionalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    skills: {
      type: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50,
      }],
      default: [],
      validate: {
        validator: (items) => items.length <= 30,
        message: "You can add up to 30 skills",
      },
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    portfolio: {
      type: [portfolioItemSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= 20,
        message: "You can add up to 20 portfolio items",
      },
    },
    verificationStatus: {
      type: String,
      enum: ["not_submitted", "pending", "verified", "rejected"],
      default: "not_submitted",
    },
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "ProfessionalProfile",
  professionalProfileSchema
);
