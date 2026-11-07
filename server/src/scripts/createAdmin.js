
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../modules/users/user.model");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Read credentials from environment variables.
    const name = process.env.ADMIN_NAME;
    const username = process.env.ADMIN_USERNAME?.toLowerCase();
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !username || !email || !password) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD"
      );
    }

    if (password.length < 12 || password.length > 72) {
      throw new Error("Admin password must be 12–72 characters");
    }

    // Don't silently promote an existing user.
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error(
        "Email or username already exists. No changes were made."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      username,
      email,
      passwordHash,
      role: "admin",
      status: "active",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
