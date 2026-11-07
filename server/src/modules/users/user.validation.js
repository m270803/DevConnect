
const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  role: z.enum(["client", "professional"]).default("client"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

module.exports = { registerSchema, loginSchema };
