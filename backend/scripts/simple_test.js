const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function runSimpleTest() {
    console.log('🚀 Starting Simple Verification...');

    try {
        // 1. Health Check
        console.log('Checking Health...');
        const healthRes = await axios.get(`${API_URL}/health`);
        console.log('✅ Health:', healthRes.data);

        // 2. Login
        console.log('\nChecking Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'password123',
            tenantSubdomain: 'demo'
        });

        if (loginRes.data.success) {
            console.log('✅ Login Successful');
            console.log('User:', loginRes.data.data.user.email);
            console.log('Token generated successfully');
        } else {
            console.error('❌ Login Failed');
        }

        console.log('\n✨ System is Operational');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

runSimpleTest();
