import { z } from "zod";

export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, "Client name must be at least 2 characters")
    .max(150, "Client name must not exceed 150 characters"),
});