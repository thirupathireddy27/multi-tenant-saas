const pool = require("../config/db");

exports.getProjects = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const result = await pool.query(
      `SELECT id, name, description, status, created_at
       FROM public.projects
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};
