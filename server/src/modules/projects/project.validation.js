
const { z } = require("zod");

const projectFieldsSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(30).max(5000),
  category: z.string().trim().min(2).max(60),

  requiredSkills: z.array(
    z.string().trim().min(1).max(40)
  ).max(20).default([]),

  budgetType: z.enum(["fixed", "hourly"]),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),

  currency: z.enum(["INR", "USD"]).default("INR"),

  deadline: z.string().datetime().nullable().optional(),

  status: z.enum(["draft", "open"]).default("draft"),
}).strict();

const projectSchema = projectFieldsSchema.refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  }
);

const updateProjectSchema = projectFieldsSchema
  .omit({ status: true })
  .partial()
  .extend({
    status: z.enum(["draft", "open", "paused", "closed"]).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
  );

module.exports = {
  projectSchema,
  updateProjectSchema,
};
