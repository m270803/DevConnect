
const { doubleCsrf } = require("csrf-csrf");

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 1000, // 1 hour
};

const {
  doubleCsrfProtection,
  generateCsrfToken: generateToken,
} = doubleCsrf({
  getSecret: () => {
    if (!process.env.CSRF_SECRET) {
      throw new Error("CSRF_SECRET is missing");
    }

    return process.env.CSRF_SECRET;
  },
  getSessionIdentifier: (req) =>
    req.cookies?.accessToken || "anonymous",
  cookieName: isProduction
    ? "__Host-csrf-token"
    : "csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  },
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

function setAuthCookie(res, token) {
  res.cookie("accessToken", token, authCookieOptions);
}

function clearAuthCookie(res) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

module.exports = {
  doubleCsrfProtection,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
};
