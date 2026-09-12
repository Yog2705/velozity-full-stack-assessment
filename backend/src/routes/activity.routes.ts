import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  getProjectActivity,
  getGlobalActivity,
  updateActivitySeen,
} from "../controllers/activity.controller.js";

const router = Router();

/*
 * Project-specific activity
 *
 * Access is further validated by the controller/service
 * and WebSocket project-room authorization.
 */
router.get(
  "/projects/:projectId/activity",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getProjectActivity
);

/*
 * Admin global activity feed
 *
 * Only Admin can access activity across
 * all projects.
 */
router.get(
  "/activity",
  authenticate,
  authorizeRoles("ADMIN"),
  getGlobalActivity
);

/*
 * Mark activity as seen
 */
router.patch(
  "/activity/seen",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  updateActivitySeen
);

export default router;