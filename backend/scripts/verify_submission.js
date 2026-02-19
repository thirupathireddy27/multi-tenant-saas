const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000/api';

const CREDENTIALS = {
    email: 'admin@demo.com',
    password: 'Demo@123', // Strict requirement
    subdomain: 'demo'
};

async function verifySubmission() {
    console.log('🚀 Starting SUBMISSION Verification (Ports 3000/5000)...');
    console.log('-----------------------------------------------------');

    // 1. Verify Frontend is Serving
    try {
        console.log(`🔹 Checking Frontend at ${FRONTEND_URL}...`);
        const feRes = await axios.get(FRONTEND_URL);
        if (feRes.status === 200 && feRes.data.includes('<div id="root">')) {
            console.log('✅ Frontend is ONLINE and serving React app (HTTP 200)');
        } else {
            console.log('⚠️ Frontend responded but content might be unexpected.');
            console.log(`   Status: ${feRes.status}`);
        }
    } catch (err) {
        console.error('❌ Frontend Check Failed:', err.message);
        console.log('   (Make sure docker-compose is up and port 3000 is free)');
    }

    // 2. Verify Backend Health
    try {
        console.log(`\n🔹 Checking Backend Health at ${API_URL}/health...`);
        const healthRes = await axios.get(`${API_URL}/health`);
        console.log('✅ Backend is ONLINE:', healthRes.data);
    } catch (err) {
        console.error('❌ Backend Health Check Failed:', err.message);
        return; // Stop if backend is down
    }

    // 3. Test Login with Strict Credentials
    try {
        console.log(`\n🔹 Testing Login with '${CREDENTIALS.email}' / '${CREDENTIALS.password}'...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: CREDENTIALS.email,
            password: CREDENTIALS.password,
            tenantSubdomain: CREDENTIALS.subdomain
        });

        if (loginRes.data.success) {
            console.log('✅ Login SUCCESSFUL');
            const token = loginRes.data.data.token;

            // 4. List Projects
            console.log('\n🔹 Verifying Project Access...');
            const projRes = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const projects = projRes.data.data.projects || [];
            console.log(`✅ Access Granted. Found ${projects.length} projects.`);
            projects.forEach(p => console.log(`   - ${p.name} (${p.status})`));
        }
    } catch (err) {
        console.error('❌ Login Verification Failed:', err.message);
        if (err.response) {
            console.error('   Server Response:', err.response.data);
        }
    }

    console.log('\n-----------------------------------------------------');
    console.log('✨ If all checks passed, your project is READY for submission.');
}

verifySubmission();
