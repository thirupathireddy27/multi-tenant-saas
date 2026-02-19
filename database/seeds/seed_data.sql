-- seed_data.sql
-- Purpose: Insert initial data for automated evaluation

BEGIN;

-- =========================
-- TENANT
-- =========================
INSERT INTO tenants (id, name, subdomain, max_users, max_projects)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Company', 'demo', 5, 3);

-- =========================
-- SUPER ADMIN
-- =========================
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NULL,
    'superadmin@system.com',
    '$2a$10$tv0PS2tXi8.XGk3S/s4NzgaV38Z2aonDgZQKQpFD72DclN',
    'System Admin',
    'super_admin'
);

-- =========================
-- TENANT ADMIN
-- =========================
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.com',
    '$2a$10$tv0PS2tXi8.XGk3S/s4NzgaV38Z2aonDgZQKQpFD72DclN', 
    'Demo Admin',
    'tenant_admin'
);

-- =========================
-- REGULAR USERS
-- =========================
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'user1@demo.com',
    '$2a$10$tv0PS2tXi8.XGk3S/s4NzgaV38Z2aonDgZQKQpFD72DclN', 
    'Demo User One',
    'user'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'user2@demo.com',
    '$2a$10$tv0PS2tXi8.XGk3S/s4NzgaV38Z2aonDgZQKQpFD72DclN', 
    'Demo User Two',
    'user'
);

-- =========================
-- PROJECTS
-- =========================
INSERT INTO projects (
    id,
    tenant_id,
    created_by,
    name,
    description,
    status
) VALUES
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Project Alpha',
    'First demo project',
    'active'
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Project Beta',
    'Second demo project',
    'active'
);

-- =========================
-- TASKS
-- =========================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to
) VALUES
(
    '1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'Design Homepage',
    'Create homepage design',
    'todo',
    'high',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
),
(
    '2222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'API Integration',
    'Integrate backend APIs',
    'in_progress',
    'medium',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- =========================
-- AUDIT LOG
-- =========================
INSERT INTO audit_logs (
    id,
    tenant_id,
    user_id,
    action,
    entity_type
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'SEED_DATA_INIT',
    'system'
);

COMMIT;
