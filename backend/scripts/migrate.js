const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'saas_db',
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('connected to database...');
        const migrationsDir = path.join(__dirname, '../migrations');

        // Ensure migrations directory exists
        if (!fs.existsSync(migrationsDir)) {
            console.error(`Migrations directory not found: ${migrationsDir}`);
            process.exit(1);
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order

        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            await client.query(sql);
        }
        console.log('Migrations completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
