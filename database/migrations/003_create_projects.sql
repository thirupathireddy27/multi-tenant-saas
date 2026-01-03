-- 003_create_projects.sql
-- Purpose: Store projects for each tenant

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,

    tenant_id UUID NOT NULL,
    created_by UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(20)
        CHECK (status IN ('active', 'archived', 'completed'))
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_projects_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
