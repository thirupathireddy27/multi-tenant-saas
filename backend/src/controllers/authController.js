const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Validation
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check if subdomain exists
        const subdomainCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (subdomainCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // Create Tenant
        const tenantId = uuidv4();
        const createTenantQuery = `
      INSERT INTO tenants (id, name, subdomain, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, $3, 'free', 5, 3)
      RETURNING id, name, subdomain
    `;
        const tenantResult = await client.query(createTenantQuery, [tenantId, tenantName, subdomain]);
        const newTenant = tenantResult.rows[0];

        // Create Admin User
        const userId = uuidv4();
        const createUserQuery = `
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5, 'tenant_admin')
      RETURNING id, email, full_name, role
    `;
        const userResult = await client.query(createUserQuery, [userId, tenantId, adminEmail, passwordHash, adminFullName]);
        const newAdmin = userResult.rows[0];

        // Audit Log
        const auditId = uuidv4();
        await client.query(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
      VALUES ($1, $2, $3, 'REGISTER_TENANT', 'tenant', $2)
    `, [auditId, tenantId, userId]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId: newTenant.id,
                subdomain: newTenant.subdomain,
                adminUser: newAdmin
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Register Tenant Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

const login = async (req, res) => {
    const { email, password, tenantSubdomain, tenantId } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Identify tenant
    let targetTenantId = null;

    console.log('--- LOGIN ATTEMPT ---');
    console.log('Email:', email);
    console.log('Subdomain:', tenantSubdomain);

    try {
        if (tenantSubdomain) {
            const tenantRes = await db.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
            if (tenantRes.rows.length === 0) {
                console.log('Tenant not found for subdomain:', tenantSubdomain);
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }
            if (tenantRes.rows[0].status !== 'active') {
                return res.status(403).json({ success: false, message: 'Tenant is not active' });
            }
            targetTenantId = tenantRes.rows[0].id;
            console.log('Target Tenant ID:', targetTenantId);
        } else if (tenantId) {
            targetTenantId = tenantId;
        }

        // Find user
        // Note: Super Admin has tenant_id = NULL. 
        // Regular users MUST match the tenant_id.
        // If tenantSubdomain is provided, we check if user belongs to it OR is super_admin.

        let userQuery = 'SELECT * FROM users WHERE email = $1';
        let queryParams = [email];

        // If tenant context is known, we can prefer users in that tenant
        // But email is unique per tenant.
        // We should first find the user and check their tenant.

        // HOWEVER, the login UI asks for "Tenant Subdomain".
        // So we should look for a user with (email, tenant_id) OR (email, tenant_id=NULL for super_admin).

        if (targetTenantId) {
            userQuery = 'SELECT * FROM users WHERE email = $1 AND (tenant_id = $2 OR tenant_id IS NULL)';
            queryParams = [email, targetTenantId];
        } else {
            // If no tenant specified, maybe we can find them? 
            // But user@demo.com can exist in multiple tenants...
            // The PRD says "Tenant Subdomain" is required in one place, but "tenantSubdomain OR tenantId" in API.
            // Let's assume strictness:
            // If the user is super_admin, they might log in without a tenant subdomain?
            // The seed data has superAdmin with tenantId=NULL.

            // Let's try to find ANY user with this email to see if they are super admin.
            userQuery = 'SELECT * FROM users WHERE email = $1';
        }

        const startQuery = await db.query(userQuery, queryParams);
        console.log('Users found with email:', startQuery.rows.length);

        if (startQuery.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // If multiple users found (same email in diff tenants) and no tenant specified -> Error?
        // But if we used the targetTenantId filter, we should get at most 2 (one user, one super_admin).
        // Prioritize the one that matches the tenant.

        let user;

        if (targetTenantId) {
            user = startQuery.rows.find(u => u.tenant_id === targetTenantId);
            if (!user) {
                user = startQuery.rows.find(u => u.tenant_id === null && u.role === 'super_admin');
            }
        } else {
            // No tenant specified. 
            // 1. Check for Super Admin first
            user = startQuery.rows.find(u => u.role === 'super_admin');

            // 2. If no super admin, and only one user found, let them in (Infer Tenant)
            if (!user && startQuery.rows.length === 1) {
                user = startQuery.rows[0];
            }

            // 3. If multiple users found and no subdomain, fails (user stays undefined)
        }

        if (!user) {
            console.log('User not found in context.');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('User found:', user.email, user.id);
        console.log('Stored Hash:', user.password_hash);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password Match Result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        // Generate Token
        const payload = {
            userId: user.id,
            tenantId: user.tenant_id, // can be null for super_admin
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_jwt_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400 // 24h in seconds
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;

        // Get user details
        const userRes = await db.query('SELECT id, email, full_name, role, is_active, tenant_id FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userRes.rows[0];

        // Get tenant details if applicable
        let tenant = null;
        if (tenantId) {
            const tenantRes = await db.query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1', [tenantId]);
            tenant = tenantRes.rows[0];
        }

        res.json({
            success: true,
            data: {
                ...user,
                tenant
            }
        });
    } catch (err) {
        console.error('Get Me Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const logout = async (req, res) => {
    // Stateless JWT, just return success
    // Optional: Log logout action
    res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
    registerTenant,
    login,
    getMe,
    logout
};
