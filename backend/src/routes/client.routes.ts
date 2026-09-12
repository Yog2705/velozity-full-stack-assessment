import { Router } from "express";

import {
  create,
  getAll,
} from "../controllers/client.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createClientSchema } from "../validators/client.validator.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  getAll
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validate(createClientSchema),
  create
);

export default router;