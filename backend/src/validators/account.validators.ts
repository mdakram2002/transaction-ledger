import { z } from "zod";

export const createAccountSchema = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict();

export const accountListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});
