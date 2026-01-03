require("dotenv").config();
const pool = require("./src/config/db");

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ DB QUERY SUCCESS:", result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB QUERY FAILED:", err.message);
    process.exit(1);
  }
})();
