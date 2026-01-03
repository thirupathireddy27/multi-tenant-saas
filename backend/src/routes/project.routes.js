const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const tenantMiddleware = require("../middleware/tenant.middleware");
const tenantAuthMiddleware = require("../middleware/tenant-auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {
  createProject,
  getProjects,
} = require("../controllers/project.controller");

// CREATE project
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  tenantAuthMiddleware,
  roleMiddleware(["tenant_admin", "super_admin"]),
  createProject
);

// GET projects (SECURE)
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  tenantAuthMiddleware,
  getProjects
);

module.exports = router;
