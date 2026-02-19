-- 005_create_audit_logs.sql
-- Purpose: Track critical system and user actions for security auditing

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,

    tenant_id UUID NULL,
    user_id UUID NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,

    ip_address VARCHAR(45),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Indexes for performance and filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
