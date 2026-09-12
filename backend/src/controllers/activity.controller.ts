import type { Request, Response } from "express";

import {
  getProjectActivities,
  getGlobalActivities,
  markActivitySeen,
} from "../services/activity.service.js";

export const getProjectActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId =
      typeof req.params.projectId === "string"
        ? req.params.projectId
        : "";

    const since =
      typeof req.query.since === "string"
        ? req.query.since
        : undefined;

    const activities =
      await getProjectActivities(
        projectId,
        since
      );

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error(
      "GET PROJECT ACTIVITY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch project activity",
    });
  }
};

export const getGlobalActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const since =
      typeof req.query.since === "string"
        ? req.query.since
        : undefined;

    const activities =
      await getGlobalActivities(since);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error(
      "GET GLOBAL ACTIVITY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch global activity",
    });
  }
};

export const updateActivitySeen = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const result =
      await markActivitySeen(
        req.user.userId
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "UPDATE ACTIVITY SEEN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update activity timestamp",
    });
  }
};