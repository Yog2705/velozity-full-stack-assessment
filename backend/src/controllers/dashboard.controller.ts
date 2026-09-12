import { Request, Response } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export const getDashboardData = async (
  req: Request & {
    user?: {
      userId: string;
      role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
    };
  },
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

    const data = await getDashboard(
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data,
    });
    } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
}