const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* ================= REGISTER ================= */
async function register(req, res) {
  try {
    const { email, password, full_name, role } = req.body;

    // tenant context must come from middleware (JWT)
    const tenantId = req.tenantId;

    if (!email || !password || !full_name || !tenantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [email, hashedPassword, full_name, role || "user", tenantId]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "User already exists in this tenant",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

/* ================= LOGIN ================= */
async function login(req, res) {
  try {
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password || !tenantSubdomain) {
      return res.status(400).json({
        success: false,
        message: "email, password, tenantSubdomain required",
      });
    }

    // 1️⃣ Resolve tenant from subdomain
    const tenantResult = await pool.query(
      `SELECT id, status FROM tenants WHERE subdomain = $1`,
      [tenantSubdomain]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tenant is not active",
      });
    }

    const tenantId = tenant.id;

    // 2️⃣ Fetch user ONLY inside this tenant
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        },
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

/* ================= CURRENT USER ================= */
function getCurrentUser(req, res) {
  return res.json({
    success: true,
    data: req.user,
  });
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
