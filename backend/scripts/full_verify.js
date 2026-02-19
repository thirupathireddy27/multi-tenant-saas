const API_URL = 'http://localhost:5000/api';

async function request(url, method = 'GET', data = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = {
        method,
        headers,
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const res = await fetch(url, options);
        // Handle 204 No Content
        if (res.status === 204) return { status: 204, ok: true };
        
        const json = await res.json();
        return { status: res.status, data: json, ok: res.ok };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function login(email, password, subdomain) {
    console.log(`🔹 Logging in as ${email} (subdomain: ${subdomain})...`);
    const res = await request(`${API_URL}/auth/login`, 'POST', {
        email, password, tenantSubdomain: subdomain
    });
    
    if (res.ok && res.data.success) {
        console.log('✅ Login: Success');
        return res.data.data.token;
    } else {
        console.error('❌ Login Failed:', res.data);
        return null;
    }
}

async function createProject(token) {
    console.log('🔹 Creating Project...');
    const res = await request(`${API_URL}/projects`, 'POST', {
        name: 'Auto Project',
        description: 'Created by verification script'
    }, token);
    
    if (res.ok) {
        console.log('✅ Create Project: Success');
        return res.data.data.id;
    } else {
        console.error('❌ Create Project Failed:', res.data);
        return null;
    }
}

async function createTask(token, projectId) {
    console.log('🔹 Creating Task...');
    const res = await request(`${API_URL}/projects/${projectId}/tasks`, 'POST', {
        title: 'Auto Task',
        description: 'Created by verification script'
    }, token);

    if (res.ok) {
        console.log('✅ Create Task: Success');
    } else {
        console.error('❌ Create Task Failed:', res.data);
    }
}

async function run() {
    console.log('🚀 Starting Full Verification (Seeded Login) 🚀');
    
    // 1. Health
    const health = await request(`${API_URL}/health`);
    if (health.ok) console.log('✅ Health Check: OK');
    else { console.error('❌ Health Check Failed', health); return; }

    // 2. Login with Seeded Admin
    // email: admin@demo.com, password: we need to know the plain text?
    // In seed_data.sql:
    // admin@demo.com hash: $2a$10$OjPacKyxIpX8X2NfY79cmI.4we77W
    // user1@demo.com hash: $2a$10$0HPsn3L (truncated?)
    // This looks like the hash for 'password' or something simple.
    // verify_submission.js (Step 130) had `password: 'Demo@123'`.
    // Let's try 'Demo@123'.
    
    const token = await login('admin@demo.com', 'Demo@123', 'demo');
    
    if (token) {
        // 3. Create Project
        const projId = await createProject(token);
        
        if (projId) {
            // 4. Create Task
            await createTask(token, projId);
        }
    } else {
        console.log('⚠️ Seeded login failed. Trying registration fallback...');
        // 5. Register Fallback
        const tenantName = `Tenant_${Date.now()}`;
        const subdomain = `test${Date.now()}`;
        const email = `admin${Date.now()}@test.com`;
        const password = 'password123';
        
        const regRes = await request(`${API_URL}/auth/register-tenant`, 'POST', {
            tenantName,
            subdomain,
            adminEmail: email,
            adminPassword: password,
            adminFullName: 'Test Admin'
        });

        if (regRes.ok) {
            console.log('✅ Tenant Registration: Success');
            const newToken = await login(email, password, subdomain);
            if (newToken) {
                const projId = await createProject(newToken);
                if (projId) await createTask(newToken, projId);
            }
        } else {
            console.error('❌ Tenant Registration Failed:', regRes.data);
        }
    }
}

run();
