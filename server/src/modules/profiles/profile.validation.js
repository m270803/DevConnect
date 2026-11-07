
const { z } = require("zod");

const portfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  projectUrl: z.string().trim().max(2048).refine(
    (value) =>
      value === "" ||
      /^https?:\/\/.+/i.test(value),
    "Project URL must start with http:// or https://"
  ).default(""),
  imageUrl: z.string().trim().max(2048).refine(
    (value) =>
      value === "" ||
      /^https?:\/\/.+/i.test(value),
    "Image URL must start with http:// or https://"
  ).default(""),
});

const profileSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(3000).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  hourlyRate: z.number().min(0).nullable().optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  availability: z.enum([
    "available",
    "busy",
    "unavailable",
  ]).optional(),
  portfolio: z.array(portfolioItemSchema).max(20).optional(),
  profileVisibility: z.enum(["public", "private"]).optional(),
}).strict();

module.exports = { profileSchema };
