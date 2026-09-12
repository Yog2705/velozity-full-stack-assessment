import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(150, "Project name must not exceed 150 characters"),

    clientId: z
      .string()
      .uuid("Client ID must be a valid UUID"),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(150, "Project name must not exceed 150 characters")
      .optional(),

    description: z
      .string()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    clientId: z
      .string()
      .uuid("Client ID must be a valid UUID"),
  })
  .strict();