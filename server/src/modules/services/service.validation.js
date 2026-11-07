
const { z } = require("zod");

const serviceSchema = z.object({
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(3000),
  category: z.string().trim().min(2).max(60),

  skills: z.array(z.string().trim().min(1).max(40))
    .max(20)
    .default([]),

  pricingType: z.enum(["fixed", "hourly"]),
  price: z.number().positive(),
  currency: z.enum(["INR", "USD"]).default("INR"),

  deliveryDays: z.number().int().min(1).max(365).nullable()
    .optional(),

  status: z.enum(["draft", "published", "paused"]).default("draft"),
}).strict();

const updateServiceSchema = serviceSchema
  .omit({ status: true })
  .partial()
  .extend({
    status: z.enum(["draft", "published", "paused"]).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
  );

module.exports = { serviceSchema, updateServiceSchema };
