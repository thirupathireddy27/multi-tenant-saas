-- 002_create_users.sql
-- Purpose: Store user accounts with tenant association and roles

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,

    -- NULL for super_admin users
    tenant_id UUID NULL,

    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    role VARCHAR(20) CHECK (role IN ('super_admin', 'tenant_admin', 'user')) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    -- Email must be unique per tenant
    CONSTRAINT unique_user_email_per_tenant
        UNIQUE (tenant_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
