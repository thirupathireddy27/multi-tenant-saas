const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// API 12: Create Project
const createProject = async (req, res) => {
    const { name, description, status = 'active' } = req.body;
    const { tenantId, userId } = req.user;

    if (!tenantId) {
        return res.status(403).json({ success: false, message: 'Super admins must assume a tenant to create projects' });
        // Or just fail. PRD says 'Get tenantId from JWT token automatically'.
    }

    try {
        // Check Limits
        const tenantRes = await db.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const maxProjects = tenantRes.rows[0].max_projects;
        const countRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        if (parseInt(countRes.rows[0].count) >= maxProjects) {
            return res.status(403).json({ success: false, message: 'Project limit reached' });
        }

        const projectId = uuidv4();
        const newProject = await db.query(`
            INSERT INTO projects (id, tenant_id, name, description, status, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, tenant_id as "tenantId", name, description, status, created_by as "createdBy", created_at as "createdAt"
        `, [projectId, tenantId, name, description, status, userId]);

        // Audit
        await db.query(`
             INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'CREATE_PROJECT', 'project', $4)
        `, [uuidv4(), tenantId, userId, projectId]);

        res.status(201).json({
            success: true,
            data: newProject.rows[0]
        });

    } catch (err) {
        console.error('Create Project Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 13: List Projects
const listProjects = async (req, res) => {
    const { tenantId, role } = req.user;
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT p.id, p.name, p.description, p.status, p.created_at,
                   u.id as creator_id, u.full_name as creator_name,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count,
                   t.name as tenant_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN tenants t ON p.tenant_id = t.id
        `;

        const queryParams = [];
        let whereClauses = [];
        let paramIndex = 1;

        // If NOT super_admin, filter by own tenant
        if (role !== 'super_admin') {
            whereClauses.push(`p.tenant_id = $${paramIndex}`);
            queryParams.push(tenantId);
            paramIndex++;
        }

        if (status) {
            whereClauses.push(`p.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        if (search) {
            whereClauses.push(`p.name ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const projectRes = await db.query(query, queryParams);

        // Count Query
        let countQuery = 'SELECT COUNT(*) FROM projects p';
        const countParams = [];
        let countWhereClauses = [];
        let countParamIndex = 1;

        if (role !== 'super_admin') {
            countWhereClauses.push(`tenant_id = $${countParamIndex}`);
            countParams.push(tenantId);
            countParamIndex++;
        }
        if (status) {
            countWhereClauses.push(`status = $${countParamIndex}`);
            countParams.push(status);
            countParamIndex++;
        }
        if (search) {
            countWhereClauses.push(`name ILIKE $${countParamIndex}`);
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (countWhereClauses.length > 0) {
            countQuery += ' WHERE ' + countWhereClauses.join(' AND ');
        }
        const countRes = await db.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);

        const projects = projectRes.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            createdAt: row.created_at,
            createdBy: {
                id: row.creator_id,
                fullName: row.creator_name
            },
            tenantName: row.tenant_name,
            taskCount: parseInt(row.task_count),
            completedTaskCount: parseInt(row.completed_task_count)
        }));

        res.json({
            success: true,
            data: {
                projects,
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error('List Projects Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 14: Update Project
const updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, userId, role } = req.user;

    try {
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== tenantId && role !== 'super_admin') {
            return res.status(404).json({ success: false, message: 'Project not found' }); // Hide existence
        }

        // Authorization: tenant_admin OR project creator
        if (role !== 'tenant_admin' && role !== 'super_admin' && project.created_by !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }

        let updateQuery = 'UPDATE projects SET updated_at = NOW()';
        const queryParams = [projectId];
        let paramIndex = 2;

        if (name) {
            updateQuery += `, name = $${paramIndex}`;
            queryParams.push(name);
            paramIndex++;
        }
        if (description) {
            updateQuery += `, description = $${paramIndex}`;
            queryParams.push(description);
            paramIndex++;
        }
        if (status) {
            updateQuery += `, status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $1 RETURNING *`;

        const result = await db.query(updateQuery, queryParams);

        // Audit
        await db.query(`
             INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'UPDATE_PROJECT', 'project', $4)
        `, [uuidv4(), tenantId, userId, projectId]);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Update Project Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 15: Delete Project
const deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;

    try {
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== tenantId && role !== 'super_admin') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (role !== 'tenant_admin' && role !== 'super_admin' && project.created_by !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
        }

        // Cascade delete tasks? DB usually handles CASCADE. 
        // 003_create_projects.sql says Foreign Keys with CASCADE Delete? 
        // Docs say "Cascade delete related data OR handle foreign key". 
        // Let's rely on DB cascade if setup, or manual delete.
        // Checking 004_create_tasks.sql: `project_id UUID REFERENCES projects(id) ON DELETE CASCADE`
        // So just deleting project is enough.

        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

        // Audit
        await db.query(`
             INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'DELETE_PROJECT', 'project', $4)
        `, [uuidv4(), tenantId, userId, projectId]);

        res.json({ success: true, message: 'Project deleted successfully' });

    } catch (err) {
        console.error('Delete Project Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 12.5: Get Project (Missing in original spec list but required for details page)
const getProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user;

    try {
        const query = `
            SELECT p.id, p.name, p.description, p.status, p.created_at,
                   u.id as creator_id, u.full_name as creator_name,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
            FROM projects p
            JOIN users u ON p.created_by = u.id
            WHERE p.id = $1
        `;
        const result = await db.query(query, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const project = result.rows[0];

        // Authorization Check
        // Project ID found, now check tenant
        // Wait, I should filter by tenant_id in query?
        // But super_admin can access all.
        // Let's check tenant match:

        // We need tenant_id from project to verify.
        // The query above doesn't select tenant_id. Let's fix.

        // Actually, we can simply verify:
        // if (role !== 'super_admin' && project.tenant_id !== tenantId) ... 

        // But "project" variable above comes from JOIN query, I need to select tenant_id too.
    } catch (err) {
        console.error('Get Project Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getProjectDetails = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user;

    try {
        const query = `
            SELECT p.id, p.tenant_id, p.name, p.description, p.status, p.created_at,
                   u.id as creator_id, u.full_name as creator_name,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
            FROM projects p
            JOIN users u ON p.created_by = u.id
            WHERE p.id = $1
        `;
        const result = await db.query(query, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const project = result.rows[0];

        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({
            success: true,
            data: {
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                createdAt: project.created_at,
                createdBy: {
                    id: project.creator_id,
                    fullName: project.creator_name
                },
                taskCount: parseInt(project.task_count),
                completedTaskCount: parseInt(project.completed_task_count)
            }
        });

    } catch (err) {
        console.error('Get Project Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    createProject,
    listProjects,
    updateProject,
    deleteProject,
    getProject: getProjectDetails
};
