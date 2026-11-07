
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./modules/users/user.routes");
const profileRoutes = require("./modules/profiles/profile.routes");
const serviceRoutes = require("./modules/services/service.routes");
const projectRoutes = require("./modules/projects/project.routes");
const proposalRoutes = require("./modules/proposals/proposal.routes");
const contractRoutes = require("./modules/contracts/contract.routes");
const milestoneRoutes = require("./modules/contracts/milestone.routes");
const conversationRoutes = require("./modules/conversations/conversation.routes");
const messageRoutes = require("./modules/messages/message.routes");


const {
  doubleCsrfProtection,
  generateToken,
} = require("./middleware/cookieSecurity.middleware");

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_URL || "http://localhost:3000",
]);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
}

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Obtain a CSRF token before making POST, PUT, PATCH or DELETE requests.
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});



app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillConnect API is running",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api", milestoneRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/milestones", milestoneRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      success: false,
      message: "Invalid or missing CSRF token. Fetch a fresh token from /api/csrf-token.",
    });
  }

  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Internal server error",
  });
});

module.exports = app;
