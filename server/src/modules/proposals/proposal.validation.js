
const { z } = require("zod");

const proposalSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid project ID"),

  coverLetter: z.string().trim().min(30).max(3000),

  proposedPrice: z.number().positive(),

  deliveryDays: z.number().int().min(1).max(365),
}).strict();

const decisionSchema = z.object({
  action: z.enum(["accept", "reject"]),
}).strict();

module.exports = {
  proposalSchema,
  decisionSchema,
};
