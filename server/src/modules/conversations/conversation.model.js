
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One conversation per project and professional pair.
conversationSchema.index(
  {
    projectId: 1,
    clientId: 1,
    professionalId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
