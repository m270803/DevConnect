
const User = require("./user.model");
const userService = require("./user.service");
const { registerSchema, loginSchema } = require("./user.validation");
const {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../../middleware/cookieSecurity.middleware");


async function register(req, res, next) {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const resultData = await userService.register(result.data);

    setAuthCookie(res, resultData.token);
    req.cookies.accessToken = resultData.token;
    const csrfToken = generateToken(req, res, { overwrite: true });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      csrfToken,
      data: { user: resultData.user },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const resultData = await userService.login(result.data);

    setAuthCookie(res, resultData.token);
    req.cookies.accessToken = resultData.token;
    const csrfToken = generateToken(req, res, { overwrite: true });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      csrfToken,
      data: { user: resultData.user },
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  delete req.cookies.accessToken;
  const csrfToken = generateToken(req, res, { overwrite: true });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    csrfToken,
  });
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: userService.publicUser(req.user),
  });
}

async function getAdminDashboard(req, res) {
  const totalUsers = await User.countDocuments();

  return res.status(200).json({
    success: true,
    message: "Admin access verified",
    data: { totalUsers },
  });
}

module.exports = { register, login, getMe, getAdminDashboard, logout };
