const jwt = require("jsonwebtoken");
const User = require("../modules/users/user.model");

async function authenticateRequest(req, res, next, optional) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.accessToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (!token) {
      if (optional) return next();

      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function authenticate(req, res, next) {
  return authenticateRequest(req, res, next, false);
}

authenticate.optional = function optionalAuthenticate(req, res, next) {
  return authenticateRequest(req, res, next, true);
};

module.exports = authenticate;
