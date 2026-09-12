import type { Request, Response } from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service.js";

export const getAll = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await getUsers();

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error(
      "GET USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve users",
    });
  }
};

export const getOne = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.id;

    if (typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve user";

    return res.status(
      message === "User not found"
        ? 404
        : 500
    ).json({
      success: false,
      message,
    });
  }
};

export const create = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const user = await createUser(
      name,
      email,
      password,
      role
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create user";

    return res.status(400).json({
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
    const userId = req.params.id;

    if (typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await updateUser(
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update user";

    return res.status(
      message === "User not found"
        ? 404
        : 400
    ).json({
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

    const userId = req.params.id;

    if (typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    await deleteUser(
      userId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete user";

    return res.status(
      message === "User not found"
        ? 404
        : message.includes("own account")
        ? 403
        : 400
    ).json({
      success: false,
      message,
    });
  }
};