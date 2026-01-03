# Product Requirements Document (PRD)

## User Personas

### 1. Super Admin
-   **Role**: System Administrator / Platform Owner.
-   **Responsibilities**: Manage the entire SaaS platform, onboard tenants, oversee plans.
-   **Goals**: Ensure system health, revenue growth (upgrading tenants).
-   **Pain Points**: Managing hundreds of tenants manually.

### 2. Tenant Admin
-   **Role**: Organization Owner / Manager.
-   **Responsibilities**: Manage their specific organization's projects and users.
-   **Goals**: Efficient project delivery, team management.
-   **Pain Points**: hitting plan limits, unauthorized user access.

### 3. End User
-   **Role**: Team Member / Employee.
-   **Responsibilities**: Execute tasks, update status.
-   **Goals**: Complete assigned work.
-   **Pain Points**: Unclear task priorities, confusing interface.

## Functional Requirements

### Authentication Module
1.  **FR-001**: The system shall allow users to login using email and password.
2.  **FR-002**: The system shall prioritize Tenant Subdomain for identifying the tenant context during login.
3.  **FR-003**: The system shall support JWT token-based authentication with 24-hour expiry.

### Tenant Management
4.  **FR-004**: The system shall allow new tenants to register with a unique subdomain.
5.  **FR-005**: The system shall isolate data such that Tenant A cannot access Tenant B's data.
6.  **FR-006**: The system shall enforce "Free", "Pro", and "Enterprise" plan limits on Users and Projects.

### User Management
7.  **FR-007**: Tenant Admins shall be able to add new users to their tenant.
8.  **FR-008**: The system shall prevent adding users if the subscription limit is reached.
9.  **FR-009**: Tenant Admins shall be able to delete users (soft delete or cascade).

### Project Management
10. **FR-010**: Users shall be able to create new projects within their tenant.
11. **FR-011**: The system shall prevent creating projects if the subscription limit is reached.
12. **FR-012**: Users shall be able to list all projects belonging to their tenant.

### Task Management
13. **FR-013**: Users shall be able to create tasks under a project.
14. **FR-014**: Users shall be able to assign tasks to other users within the same tenant.
15. **FR-015**: Users shall be able to update task status (Todo -> In Progress -> Completed).

## Non-Functional Requirements

1.  **NFR-001 (Security)**: All user passwords must be hashed using bcrypt or better.
2.  **NFR-002 (Performance)**: API response time should be under 200ms for 90% of requests.
3.  **NFR-003 (Scalability)**: The database schema must support indexing on `tenant_id` to handle high concurrency.
4.  **NFR-004 (Availability)**: The system must be containerized (Docker) to ensure consistent deployment and high availability potential.
5.  **NFR-005 (Usability)**: The frontend must be responsive and work on mobile devices.
