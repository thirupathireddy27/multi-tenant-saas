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

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding database...');
        // Only one seed file is expected based on current structure
        // But we need to handle if it's in backend/seeds or database/seeds
        // The previous structure had seeds in backend/seeds? No, backend/scripts/init-db.sh referenced /app/database/seeds/seed_data.sql

        // We will look for seed_data.sql in ../seeds relative to this script (backend/seeds) OR in ../../database/seeds
        // Let's assume we copy it to backend/seeds for the npm script to work contentiously, or we reference it directly.

        // Challenge: backend/seeds might not exist in the repo structure shown in `list_dir`. 
        // `list_dir backend` showed `migrations` but not `seeds`.
        // `database/seeds/seed_data.sql` exists.

        // Let's try to read from ../../database/seeds/seed_data.sql first (local dev)
        // If we are in docker, it might be different. 

        let seedPath = path.join(__dirname, '../../database/seeds/seed_data.sql');

        if (!fs.existsSync(seedPath)) {
            // Try backend/seeds if expected there
            seedPath = path.join(__dirname, '../seeds/seed_data.sql');
        }

        if (!fs.existsSync(seedPath)) {
            // in Docker, it might be mounted at /app/database/seeds/seed_data.sql
            if (fs.existsSync('/app/database/seeds/seed_data.sql')) {
                seedPath = '/app/database/seeds/seed_data.sql';
            } else {
                console.error('Seed file not found');
                process.exit(1);
            }
        }

        console.log(`Running seed from: ${seedPath}`);
        const sql = fs.readFileSync(seedPath, 'utf8');
        await client.query(sql);
        console.log('Seeding completed successfully');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
