const db = require('../config/db');

// API 5: Get Tenant Details
const getTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { userId, role, tenantId: userTenantId } = req.user;

    // Authorization
    if (role !== 'super_admin' && userTenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        const tenantRes = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const tenant = tenantRes.rows[0];

        // Stats
        const usersCountRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const projectsCountRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const tasksCountRes = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

        res.json({
            success: true,
            data: {
                ...tenant,
                stats: {
                    totalUsers: parseInt(usersCountRes.rows[0].count),
                    totalProjects: parseInt(projectsCountRes.rows[0].count),
                    totalTasks: parseInt(tasksCountRes.rows[0].count)
                }
            }
        });
    } catch (err) {
        console.error('Get Tenant Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 6: Update Tenant
const updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
    const { role, tenantId: userTenantId } = req.user;

    // Authorization
    if (role !== 'super_admin' && userTenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Role-based field restrictions
    if (role !== 'super_admin') {
        if (status || subscriptionPlan || maxUsers || maxProjects) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update restricted fields' });
        }
    }

    try {
        let updateQuery = 'UPDATE tenants SET updated_at = NOW()';
        const queryParams = [tenantId];
        let paramIndex = 2;

        if (name) {
            updateQuery += `, name = $${paramIndex}`;
            queryParams.push(name);
            paramIndex++;
        }

        if (role === 'super_admin') {
            if (status) {
                updateQuery += `, status = $${paramIndex}`;
                queryParams.push(status);
                paramIndex++;
            }
            if (subscriptionPlan) {
                updateQuery += `, subscription_plan = $${paramIndex}`;
                queryParams.push(subscriptionPlan);
                paramIndex++;
            }
            if (maxUsers) {
                updateQuery += `, max_users = $${paramIndex}`;
                queryParams.push(maxUsers);
                paramIndex++;
            }
            if (maxProjects) {
                updateQuery += `, max_projects = $${paramIndex}`;
                queryParams.push(maxProjects);
                paramIndex++;
            }
        }

        updateQuery += ` WHERE id = $1 RETURNING *`;

        const result = await db.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        // Audit Log
        const { v4: uuidv4 } = require('uuid');
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'UPDATE_TENANT', 'tenant', $2)
        `, [uuidv4(), tenantId, req.user.userId]);

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Update Tenant Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 7: List All Tenants
const listTenants = async (req, res) => {
    const { role } = req.user;
    if (role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM tenants';
        const queryParams = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (status) {
            whereClauses.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        if (subscriptionPlan) {
            whereClauses.push(`subscription_plan = $${paramIndex}`);
            queryParams.push(subscriptionPlan);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const tenantsRes = await db.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM tenants';
        if (whereClauses.length > 0) {
            countQuery += ' WHERE ' + whereClauses.join(' AND ');
        }
        const countParams = queryParams.slice(0, paramIndex - 1);
        const countRes = await db.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);

        res.json({
            success: true,
            data: {
                tenants: tenantsRes.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalTenants: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error('List Tenants Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    getTenant,
    updateTenant,
    listTenants
};
