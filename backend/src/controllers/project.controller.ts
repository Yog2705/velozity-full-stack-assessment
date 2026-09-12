import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../services/project.service.js";

export const create = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const {
      name,
      description,
      clientId,
    } = req.body;

    const project = await createProject(
      name,
      description,
      clientId,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error(
      "PROJECT CREATE ERROR:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create project",
    });
  }
};

export const getAll = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projects = await getProjects(
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    console.error(
      "PROJECT LIST ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve projects",
    });
  }
};

export const getOne = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projectId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const project = await getProjectById(
      projectId,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    console.error(
      "PROJECT DETAILS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Project not found";

    res.status(
      message.includes("not allowed")
        ? 403
        : 404
    ).json({
      success: false,
      message,
    });
  }
};

export const update = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projectId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const project = await updateProject(
      projectId,
      req.body,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error(
      "PROJECT UPDATE ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update project";

    res.status(
      message.includes("not allowed")
        ? 403
        : 400
    ).json({
      success: false,
      message,
    });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const projectId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const result = await deleteProject(
      projectId,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "PROJECT DELETE ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete project";

    res.status(
      message.includes("not allowed")
        ? 403
        : 400
    ).json({
      success: false,
      message,
    });
  }
};