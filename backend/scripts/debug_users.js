const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'saas_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5433,
});

async function run() {
    try {
        const res = await pool.query(`SELECT email, password_hash, role, tenant_id FROM users`);
        console.log('Current Users in DB:');
        res.rows.forEach(u => {
            console.log(`- ${u.email} | Role: ${u.role} | Hash: ${u.password_hash.substring(0, 20)}...`);
        });

        // Verify current hash against 'Demo@123'
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare('Demo@123', '$2b$10$4jla5we1Z3UoSSyMukX0L.ew9RqieE8zuGaE6gSbBuj6L0');
        console.log(`\nHash Verification (Script Variable): ${isMatch}`);

        if (res.rows.length > 0) {
            const userMath = await bcrypt.compare('Demo@123', res.rows[0].password_hash);
            console.log(`Hash Verification (DB User ${res.rows[0].email}): ${userMath}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
