import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";

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

    const notifications = await getUserNotifications(
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("NOTIFICATION GET ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve notifications",
    });
  }
};

export const markAsRead = async (
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

    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!notificationId) {
      res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
      return;
    }

    const notification =
      await markNotificationAsRead(
        notificationId,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error(
      "NOTIFICATION READ ERROR:",
      error
    );

    res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Notification not found",
    });
  }
};

export const markAllAsRead = async (
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

    await markAllNotificationsAsRead(
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "NOTIFICATION READ ALL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read",
    });
  }
};