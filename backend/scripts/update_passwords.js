const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'saas_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5433, // Updated port
});

async function run() {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Demo@123', 10);
    console.log('Generated new hash:', hash);
    try {
        const res = await pool.query(`
            UPDATE users 
            SET password_hash = $1 
            WHERE email IN ('superadmin@system.com', 'user1@demo.com', 'admin@demo.com')
        `, [hash]);
        console.log(`Updated ${res.rowCount} users.`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
