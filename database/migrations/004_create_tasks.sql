-- 004_create_tasks.sql
-- Purpose: Store tasks within projects with tenant isolation

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,

    project_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(20)
        CHECK (status IN ('todo', 'in_progress', 'completed'))
        NOT NULL DEFAULT 'todo',

    priority VARCHAR(20)
        CHECK (priority IN ('low', 'medium', 'high'))
        NOT NULL DEFAULT 'medium',

    assigned_to UUID NULL,
    due_date DATE NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tasks_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tasks_assigned_user
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    