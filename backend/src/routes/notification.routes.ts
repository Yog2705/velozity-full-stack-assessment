import { Router } from "express";

import {
  getAll,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Get current user's notifications
router.get(
  "/",
  authenticate,
  getAll
);

// Mark one notification as read
router.patch(
  "/:id/read",
  authenticate,
  markAsRead
);

// Mark all current user's notifications as read
router.patch(
  "/read-all",
  authenticate,
  markAllAsRead
);

export default router;