import { z } from "zod";

export const createTransactionSchema = z
  .object({
    type: z.enum(["credit", "debit"]),
    amount: z.number().finite().positive().max(1_000_000_000),
    description: z.string().trim().min(1).max(500),
    reference_id: z.string().trim().min(1).max(120),
  })
  .strict();

export const transactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["credit", "debit"]).optional(),
});
