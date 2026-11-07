
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user.model");

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

async function register(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await User.create({
      name: data.name,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
    });

    return {
      user: publicUser(user),
      token: createToken(user),
    };
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      const duplicateError = new Error(
        field === "email"
          ? "Email is already registered"
          : "Username is already taken"
      );

      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
}

async function login(data) {
  const user = await User.findOne({ email: data.email })
    .select("+passwordHash");

  // Use a generic message to avoid revealing which emails are registered.
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("This account is not active");
    error.statusCode = 403;
    throw error;
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: publicUser(user),
    token: createToken(user),
  };
}

module.exports = { register, login, publicUser };
