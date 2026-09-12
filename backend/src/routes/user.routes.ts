import { Router } from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

const router = Router();

/*
 * USER MANAGEMENT
 * Admin only
 */

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getAll
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  getOne
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  validate(createUserSchema),
  create
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  validate(updateUserSchema),
  update
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  remove
);

export default router;