const bcrypt = require('bcryptjs');

const passwords = ['Admin@123', 'Demo@123', 'User@123'];

async function generate() {
    console.log('Generating hashes...');
    for (const p of passwords) {
        const hash = await bcrypt.hash(p, 10);
        console.log(`${p}: ${hash}`);
    }
}

generate();
