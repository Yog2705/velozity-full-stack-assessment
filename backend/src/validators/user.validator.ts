import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),

    email: z
      .string()
      .email("Please provide a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters"),

    role: z.enum([
      "ADMIN",
      "PROJECT_MANAGER",
      "DEVELOPER",
    ]),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    email: z
      .string()
      .email("Please provide a valid email address")
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .optional(),

    role: z
      .enum([
        "ADMIN",
        "PROJECT_MANAGER",
        "DEVELOPER",
      ])
      .optional(),
  })
  .strict();