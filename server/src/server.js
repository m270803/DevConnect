
require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initializeSocket = require("./socket");

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set a strong JWT_SECRET of at least 32 characters");
  }

  await connectDB();

  const PORT = process.env.PORT || 5000;
  const httpServer = http.createServer(app);

  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`SkillConnect API running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
