const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// API 8: Add User to Tenant
const addUser = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role = 'user' } = req.body;
    const { role: userRole, tenantId: userTenantId } = req.user;

    // Authorization
    if (userRole !== 'tenant_admin' || userTenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        // Check Limits
        const tenantRes = await db.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        const maxUsers = tenantRes.rows[0].max_users;
        const countRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const currentUsers = parseInt(countRes.rows[0].count);

        if (currentUsers >= maxUsers) {
            return res.status(403).json({ success: false, message: 'Subscription limit reached' });
        }

        // Check Email uniqueness in Tenant
        const emailCheck = await db.query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenantId, email]);
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }

        // Create User
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUserId = uuidv4();

        const newUser = await db.query(`
            INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, full_name, role, tenant_id, is_active, created_at
        `, [newUserId, tenantId, email, passwordHash, fullName, role]);

        // Audit Log
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'CREATE_USER', 'user', $4)
        `, [uuidv4(), tenantId, req.user.userId, newUserId]);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser.rows[0]
        });

    } catch (err) {
        console.error('Add User Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 9: List Tenant Users
const listTenantUsers = async (req, res) => {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role: userRole } = req.user;

    // Auth: User must belong to tenant (or super_admin? PRD says "User must belong to this tenant")
    if (userRole !== 'super_admin' && userTenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const { page = 1, limit = 50, search, role } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
        const queryParams = [tenantId];
        let paramIndex = 2;

        if (search) {
            query += ` AND (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }
        if (role) {
            query += ` AND role = $${paramIndex}`;
            queryParams.push(role);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const usersRes = await db.query(query, queryParams);

        // Count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE tenant_id = $1';
        const countParams = [tenantId];
        let countParamIndex = 2; // Separate index for count query
        if (search) {
            countQuery += ` AND (email ILIKE $${countParamIndex} OR full_name ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }
        if (role) {
            countQuery += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        const countRes = await db.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);

        res.json({
            success: true,
            data: {
                users: usersRes.rows,
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error('List Users Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 10: Update User
const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { userId: requesterId, role: requesterRole, tenantId: requesterTenantId } = req.user;

    try {
        // Get target user to check tenant
        const targetUserRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
        if (targetUserRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const targetUserTenantId = targetUserRes.rows[0].tenant_id;

        // Auth
        if (requesterRole !== 'super_admin' && requesterTenantId !== targetUserTenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Check permissions for fields
        // Users can update their own fullName
        // implementer note: PRD says "Users can update their own fullName", "Only tenant_admin can update role and isActive"

        const isSelf = requesterId === userId;
        const isAdmin = requesterRole === 'tenant_admin' || requesterRole === 'super_admin';

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        let updateQuery = 'UPDATE users SET updated_at = NOW()';
        const queryParams = [userId];
        let paramIndex = 2;

        if (fullName) {
            updateQuery += `, full_name = $${paramIndex}`;
            queryParams.push(fullName);
            paramIndex++;
        }

        if ((role || isActive !== undefined) && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admins can update role or status' });
        }

        if (role) {
            updateQuery += `, role = $${paramIndex}`;
            queryParams.push(role);
            paramIndex++;
        }
        if (isActive !== undefined) {
            updateQuery += `, is_active = $${paramIndex}`;
            queryParams.push(isActive);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $1 RETURNING id, full_name, role, is_active, updated_at`;

        const result = await db.query(updateQuery, queryParams);

        // Audit Log
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'UPDATE_USER', 'user', $4)
        `, [uuidv4(), targetUserTenantId, requesterId, userId]);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 11: Delete User
const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const { userId: requesterId, role: requesterRole, tenantId: requesterTenantId } = req.user;

    if (userId === requesterId) {
        return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    try {
        const targetUserRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
        if (targetUserRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const targetUserTenantId = targetUserRes.rows[0].tenant_id;

        if (requesterRole !== 'super_admin') {
            if (requesterRole !== 'tenant_admin' || requesterTenantId !== targetUserTenantId) {
                return res.status(403).json({ success: false, message: 'Unauthorized access' });
            }
        }

        // Cascade handling: Set assigned_to = NULL in tasks
        await db.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [userId]);

        // Delete User
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        // Audit Log
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'DELETE_USER', 'user', $4)
        `, [uuidv4(), targetUserTenantId, requesterId, userId]);

        res.json({ success: true, message: 'User deleted successfully' });

    } catch (err) {
        console.error('Delete User Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    addUser,
    listTenantUsers,
    updateUser,
    deleteUser
};
