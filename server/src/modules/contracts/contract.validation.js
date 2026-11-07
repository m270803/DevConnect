
const { z } = require("zod");

const contractStatusSchema = z.object({
  status: z.enum(["completed", "cancelled"]),
}).strict();

module.exports = { contractStatusSchema };
