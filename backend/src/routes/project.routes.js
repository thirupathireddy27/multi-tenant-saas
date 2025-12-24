const express = require("express");
const router = express.Router();

const { createProject } = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["tenant_admin", "super_admin"]),
  createProject
);

module.exports = router;
