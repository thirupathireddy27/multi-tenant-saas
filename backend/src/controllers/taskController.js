const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// API 16: Create Task
const createTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
    const { tenantId: userTenantId, userId } = req.user;

    try {
        // Verify Project
        const projectRes = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const projectTenantId = projectRes.rows[0].tenant_id;

        // Verify Tenant Access
        if (userTenantId !== projectTenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access to project' });
        }

        // Verify Assigned User (if provided)
        if (assignedTo) {
            const userRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userRes.rows.length === 0 || userRes.rows[0].tenant_id !== projectTenantId) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to the same tenant' });
            }
        }

        const taskId = uuidv4();
        const newTask = await db.query(`
            INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
            VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8)
            RETURNING *
        `, [taskId, projectId, projectTenantId, title, description, priority, assignedTo, dueDate]);

        // Audit
        await db.query(`
             INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'CREATE_TASK', 'task', $4)
        `, [uuidv4(), projectTenantId, userId, taskId]);

        res.status(201).json({
            success: true,
            data: newTask.rows[0]
        });

    } catch (err) {
        console.error('Create Task Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 17: List Project Tasks
const listProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId: userTenantId } = req.user;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const projectRes = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        if (projectRes.rows[0].tenant_id !== userTenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        let query = `
            SELECT t.*, u.id as assignee_id, u.full_name as assignee_name, u.email as assignee_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = $1
        `;
        const queryParams = [projectId];
        let paramIndex = 2;

        if (status) {
            query += ` AND t.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        if (assignedTo) {
            query += ` AND t.assigned_to = $${paramIndex}`;
            queryParams.push(assignedTo);
            paramIndex++;
        }
        if (priority) {
            query += ` AND t.priority = $${paramIndex}`;
            queryParams.push(priority);
            paramIndex++;
        }
        if (search) {
            query += ` AND t.title ILIKE $${paramIndex}`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const tasksRes = await db.query(query, queryParams);

        // Count
        let countQuery = 'SELECT COUNT(*) FROM tasks t WHERE t.project_id = $1';
        const countParams = [projectId];
        let countParamIndex = 2;
        if (status) { countQuery += ` AND t.status = $${countParamIndex}`; countParams.push(status); countParamIndex++; }
        if (assignedTo) { countQuery += ` AND t.assigned_to = $${countParamIndex}`; countParams.push(assignedTo); countParamIndex++; }
        if (priority) { countQuery += ` AND t.priority = $${countParamIndex}`; countParams.push(priority); countParamIndex++; }
        if (search) { countQuery += ` AND t.title ILIKE $${countParamIndex}`; countParams.push(`%${search}%`); countParamIndex++; }

        const countRes = await db.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);

        const tasks = tasksRes.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            dueDate: row.due_date,
            createdAt: row.created_at,
            assignedTo: row.assignee_id ? {
                id: row.assignee_id,
                fullName: row.assignee_name,
                email: row.assignee_email
            } : null
        }));

        res.json({
            success: true,
            data: {
                tasks,
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error('List Tasks Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 18: Update Task Status
const updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId: userTenantId } = req.user;

    if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        if (taskRes.rows[0].tenant_id !== userTenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(`
            UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at
        `, [status, taskId]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Update Task Status Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 19: Update Task
const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId: userTenantId, userId } = req.user;

    try {
        const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const taskTenantId = taskRes.rows[0].tenant_id;

        if (taskTenantId !== userTenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (assignedTo) {
            const userRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userRes.rows.length === 0 || userRes.rows[0].tenant_id !== taskTenantId) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to same tenant' });
            }
        }

        let updateQuery = 'UPDATE tasks SET updated_at = NOW()';
        const queryParams = [taskId];
        let paramIndex = 2;

        if (title) { updateQuery += `, title = $${paramIndex}`; queryParams.push(title); paramIndex++; }
        if (description) { updateQuery += `, description = $${paramIndex}`; queryParams.push(description); paramIndex++; }
        if (status) { updateQuery += `, status = $${paramIndex}`; queryParams.push(status); paramIndex++; }
        if (priority) { updateQuery += `, priority = $${paramIndex}`; queryParams.push(priority); paramIndex++; }
        if (assignedTo !== undefined) {
            // Handle explicit null for unassign
            updateQuery += `, assigned_to = $${paramIndex}`;
            queryParams.push(assignedTo);
            paramIndex++;
        }
        if (dueDate !== undefined) {
            updateQuery += `, due_date = $${paramIndex}`;
            queryParams.push(dueDate);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $1 RETURNING *`;

        const result = await db.query(updateQuery, queryParams);

        // Populate assignedTo details
        const updatedTask = result.rows[0];
        let assignee = null;
        if (updatedTask.assigned_to) {
            const u = await db.query('SELECT id, full_name, email FROM users WHERE id = $1', [updatedTask.assigned_to]);
            assignee = u.rows[0];
        }

        // Audit Log
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'UPDATE_TASK', 'task', $4)
        `, [uuidv4(), taskTenantId, userId, taskId]);

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: {
                ...updatedTask,
                assignedTo: assignee
            }
        });

    } catch (err) {
        console.error('Update Task Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// API 20: Delete Task
const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const { tenantId: userTenantId, userId } = req.user;

    try {
        const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const taskTenantId = taskRes.rows[0].tenant_id;

        if (taskTenantId !== userTenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        // Audit Log
        await db.query(`
            INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, $3, 'DELETE_TASK', 'task', $4)
        `, [uuidv4(), taskTenantId, userId, taskId]);

        res.json({ success: true, message: 'Task deleted successfully' });

    } catch (err) {
        console.error('Delete Task Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    createTask,
    listProjectTasks,
    updateTaskStatus,
    updateTask,
    deleteTask
};
