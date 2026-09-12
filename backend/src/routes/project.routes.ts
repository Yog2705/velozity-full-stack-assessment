import { Router } from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/project.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = Router();

/*
 * CREATE PROJECT
 * Admin + Project Manager
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  validate(createProjectSchema),
  create
);

/*
 * GET ALL PROJECTS
 * All authenticated roles.
 *
 * Service layer applies:
 * - Admin → all projects
 * - PM → own projects
 * - Developer → no project management data
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
 * GET SINGLE PROJECT
 * All authenticated roles.
 *
 * Service layer performs the
 * project ownership/access check.
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
 * UPDATE PROJECT
 * Admin + Project Manager
 *
 * Service layer additionally ensures
 * PM can update only projects they created.
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  validate(updateProjectSchema),
  update
);

/*
 * DELETE PROJECT
 * Admin + Project Manager
 *
 * Service layer additionally ensures
 * PM can delete only projects they created.
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