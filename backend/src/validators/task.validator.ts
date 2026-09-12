import { z } from "zod";

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters")
      .max(200, "Task title must not exceed 200 characters"),

    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .nullable()
      .optional(),

    projectId: z
      .string()
      .uuid("Project ID must be a valid UUID"),

    assignedDeveloperId: z
      .string()
      .uuid("Developer ID must be a valid UUID")
      .nullable()
      .optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .optional(),

    dueDate: z
      .string()
      .datetime("Due date must be a valid date")
      .nullable()
      .optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters")
      .max(200, "Task title must not exceed 200 characters")
      .optional(),

    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .nullable()
      .optional(),

    assignedDeveloperId: z
      .string()
      .uuid("Developer ID must be a valid UUID")
      .nullable()
      .optional(),

    status: z
      .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
      .optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .optional(),

    dueDate: z
      .string()
      .datetime("Due date must be a valid date")
      .nullable()
      .optional(),
  })
  .strict();