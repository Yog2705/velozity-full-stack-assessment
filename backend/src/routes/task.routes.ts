import { Router } from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/task.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.validator.js";

const router = Router();

/*
 * CREATE TASK
 * Admin + Project Manager
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  validate(createTaskSchema),
  create
);

/*
 * GET ALL TASKS
 * All authenticated roles.
 *
 * Service layer applies:
 * - Admin → all accessible tasks
 * - PM → own project tasks
 * - Developer → assigned tasks
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getAll
);

/*
 * GET SINGLE TASK
 * All authenticated roles.
 *
 * Service layer performs the
 * ownership/assignment check.
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getOne
);

/*
 * UPDATE TASK
 * All roles reach the API middleware,
 * but the service layer determines
 * whether that specific user can update it.
 *
 * Developer → only assigned task
 * PM → only tasks in own projects
 * Admin → allowed
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  validate(updateTaskSchema),
  update
);

/*
 * DELETE TASK
 * Admin + Project Manager
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  remove
);

export default router;