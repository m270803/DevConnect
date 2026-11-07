const { z } = require("zod");

const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

module.exports = {
  sendMessageSchema,
};
