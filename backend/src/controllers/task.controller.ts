import { Request, Response } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../services/task.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role:
          | "ADMIN"
          | "PROJECT_MANAGER"
          | "DEVELOPER";
      };
    }
  }
}

export const create = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const task = await createTask(
      req.body,
      req.user.userId,
      req.user.role
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error(
      "CREATE TASK ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create task";

    const status = message.includes(
      "not allowed"
    )
      ? 403
      : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const getAll = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const priority =
      typeof req.query.priority === "string"
        ? req.query.priority
        : undefined;

    const overdue =
      typeof req.query.overdue === "string"
        ? req.query.overdue === "true"
        : undefined;

    const dueDateFrom =
      typeof req.query.dueDateFrom ===
      "string"
        ? req.query.dueDateFrom
        : undefined;

    const dueDateTo =
      typeof req.query.dueDateTo === "string"
        ? req.query.dueDateTo
        : undefined;

    const tasks = await getTasks(
      req.user.userId,
      req.user.role,
      {
        ...(status !== undefined && {
          status: status as
            | "TODO"
            | "IN_PROGRESS"
            | "IN_REVIEW"
            | "DONE",
        }),

        ...(priority !== undefined && {
          priority: priority as
            | "LOW"
            | "MEDIUM"
            | "HIGH"
            | "CRITICAL",
        }),

        ...(overdue !== undefined && {
          overdue,
        }),

        ...(dueDateFrom !== undefined && {
          dueDateFrom,
        }),

        ...(dueDateTo !== undefined && {
          dueDateTo,
        }),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    console.error(
      "GET TASKS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch tasks";

    const status =
      message.includes("Invalid dueDate")
        ? 400
        : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const getOne = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const taskId = req.params.id;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await getTaskById(
      taskId,
      req.user.userId,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch task";

    const status =
      message === "Task not found"
        ? 404
        : 403;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const update = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const taskId = req.params.id;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await updateTask(
      taskId,
      req.body,
      req.user.userId,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task";

    const status =
      message === "Task not found"
        ? 404
        : message.includes("not allowed") ||
          message.includes("only")
        ? 403
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const remove = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const taskId = req.params.id;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    await deleteTask(
      taskId,
      req.user.userId,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Task not found";

    const status =
      message === "Task not found"
        ? 404
        : message.includes("not allowed") ||
          message.includes("cannot")
        ? 403
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};