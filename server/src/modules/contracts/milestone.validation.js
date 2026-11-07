
const { z } = require("zod");

const createMilestoneSchema = z
  .object({
    title: z.string().trim().min(3).max(120),

    description: z.string().trim().min(5).max(2000),

    amount: z.number().positive().finite(),

    dueDate: z.coerce.date(),
  })
  .strict();

const submitMilestoneSchema = z
  .object({
    feedback: z.string().trim().max(1000).optional(),
  })
  .strict();

const milestoneDecisionSchema = z
  .object({
    action: z.enum(["approve", "request_revision"]),
    feedback: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.action !== "request_revision" ||
      Boolean(data.feedback?.trim()),
    {
      message: "Feedback is required when requesting a revision",
      path: ["feedback"],
    }
  );

module.exports = {
  createMilestoneSchema,
  submitMilestoneSchema,
  milestoneDecisionSchema,
};
