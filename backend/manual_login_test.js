const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

const ACCOUNTS_TO_FIX = [
    { email: 'user1@demo.com', password: 'password123', subdomain: 'demo' },
    { email: 'admin@demo.com', password: 'password123', subdomain: 'demo' },
    { email: 'superadmin@system.com', password: 'supersecret', subdomain: null } // Super admin might likely login without subdomain or ignore it
];

async function fixAccount(acc) {
    console.log(`\n--- CHECKING: ${acc.email} ---`);

    try {
        // 1. Find User
        // Simplified lookup: just find by email for repair purposes
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [acc.email]);

        if (userRes.rows.length === 0) {
            console.error('❌ User not found in DB!');
            return;
        }

        const user = userRes.rows[0];
        console.log(`✅ User Found: ID=${user.id}, Role=${user.role}`);

        // 2. Compare Password
        console.log('2. Verifying Password...');
        const isMatch = await bcrypt.compare(acc.password, user.password_hash);
        console.log(`   Current Password Match: ${isMatch}`);

        if (isMatch) {
            console.log('🎉 ALREADY WORKING');
        } else {
            console.error('❌ PASSWORD MISMATCH - FIXING IT NOW...');

            // Generate new hash
            const newHash = await bcrypt.hash(acc.password, 10);

            // Update DB
            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
            console.log('   ✅ Database Updated with New Hash');

            // Verify Again
            const verifyMatch = await bcrypt.compare(acc.password, newHash);
            console.log(`   Re-Verification Result: ${verifyMatch}`);
        }

    } catch (err) {
        console.error('🚨 ERROR:', err);
    }
}

async function runAll() {
    for (const acc of ACCOUNTS_TO_FIX) {
        await fixAccount(acc);
    }
    process.exit();
}

runAll();
