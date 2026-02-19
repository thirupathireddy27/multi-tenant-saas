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

    const client = await db.pool.connect();

    try {
        // 1. Identify Tenant Context if provided
        let targetTenantId = null;
        if (tenantSubdomain) {
            const tenantRes = await client.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
            if (tenantRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }
            if (tenantRes.rows[0].status !== 'active') {
                return res.status(403).json({ success: false, message: 'Tenant is not active' });
            }
            targetTenantId = tenantRes.rows[0].id;
        } else if (tenantId) {
            targetTenantId = tenantId;
        }

        // 2. Fetch all users with this email
        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const users = userRes.rows;

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Select the correct user based on context
        let user = null;

        if (targetTenantId) {
            // Context is specific tenant
            // Prioritize user in that tenant
            user = users.find(u => u.tenant_id === targetTenantId);

            // If not found, check if there is a super admin
            if (!user) {
                user = users.find(u => u.role === 'super_admin');
                // Super admins (tenant_id IS NULL) can access any tenant
            }

            if (!user) {
                // User exists but not in this tenant and not super admin
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            // No context
            // 1. Check for Super Admin
            user = users.find(u => u.role === 'super_admin');

            // 2. If single user, infer context
            if (!user && users.length === 1) {
                user = users[0];
            }

            // 3. If multiple users and no context -> Ambiguous
            if (!user && users.length > 1) {
                return res.status(400).json({ success: false, message: 'Tenant subdomain required' });
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 4. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        // 5. Generate Token
        // For Super Admin accessing a specific tenant, we might want to stash that tenantId in the token?
        // Or keep it null. The requirements say "tenantId: null" for super_admin.
        // But if they are "logging in to a tenant", frontend might expect tenantId.
        // However, standard RBAC usually keeps user's native tenantId.
        // We will respect the user's record.

        const payload = {
            userId: user.id,
            tenantId: user.tenant_id,
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
                expiresIn: 86400
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        client.release();
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
