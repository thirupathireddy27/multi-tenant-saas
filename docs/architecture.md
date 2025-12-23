# Architecture Document
## Multi-Tenant SaaS Platform – Project & Task Management System

## 1. System Architecture Overview

The Multi-Tenant SaaS Platform is designed using a modular, layered architecture that separates concerns between the frontend, backend, and database layers. This architectural approach improves scalability, maintainability, and security while ensuring strict data isolation between tenants.

At a high level, the system consists of three major components: a client-side frontend application, a backend API server, and a relational database. These components communicate with each other through well-defined interfaces and operate within a containerized environment managed by Docker.

The frontend application is built using React and runs in the user’s browser. It is responsible for rendering user interfaces such as login pages, dashboards, project views, and task management screens. The frontend communicates with the backend exclusively through RESTful API calls over HTTP. All protected requests include a JSON Web Token (JWT) in the Authorization header, which is used to verify user identity and permissions.

The backend API server is implemented using Node.js and Express.js. It serves as the core of the system and handles all business logic, authentication, authorization, and tenant isolation. The backend exposes a set of REST APIs for authentication, tenant management, user management, project management, and task management. Middleware layers are used to validate JWT tokens, enforce role-based access control (RBAC), and ensure that tenant-specific queries are properly filtered using the tenant identifier.

The database layer uses PostgreSQL as a relational data store. All tenant-specific entities such as users, projects, and tasks include a tenant_id column to enforce logical data isolation. Database constraints, foreign keys, and indexes are used to maintain data integrity and optimize query performance. Super administrator users are stored as a special case with a NULL tenant_id, allowing system-wide access without violating tenant boundaries.

To support scalability and consistent deployment, the entire system is containerized using Docker. Docker Compose is used to orchestrate the frontend, backend, and database services, allowing the application to be started with a single command. This setup ensures consistent environments across development, testing, and evaluation, and simplifies dependency management.

Overall, this architecture ensures a clear separation of responsibilities, secure multi-tenant data handling, and flexibility for future enhancements. By combining a modern frontend framework, a robust backend API layer, and a reliable relational database, the system provides a strong foundation for a production-ready multi-tenant SaaS platform.


## 2. High-Level System Architecture Diagram
The high-level system architecture diagram illustrates the interaction between the client, frontend, backend, and database components within a Dockerized environment.


## 3. Database Schema Design (ERD)

## 4. Multi-Tenancy & Data Isolation Strategy

## 5. API Architecture

The backend of the multi-tenant SaaS platform exposes a set of RESTful APIs organized by functional modules. All APIs follow a consistent response structure and enforce authentication, authorization, and tenant isolation at the API level.

Each protected API requires a valid JSON Web Token (JWT) in the Authorization header. Tenant context is derived from the JWT token and never trusted from client input. Role-based access control (RBAC) is applied to restrict sensitive operations.

---

### 5.1 Authentication APIs

| Method | Endpoint | Authentication | Role |
|------|---------|----------------|------|
| POST | /api/auth/register-tenant | No | Public |
| POST | /api/auth/login | No | Public |
| GET  | /api/auth/me | Yes | All roles |
| POST | /api/auth/logout | Yes | All roles |

---

### 5.2 Tenant Management APIs

| Method | Endpoint | Authentication | Role |
|------|---------|----------------|------|
| GET | /api/tenants/:tenantId | Yes | Tenant Admin / Super Admin |
| PUT | /api/tenants/:tenantId | Yes | Tenant Admin / Super Admin |
| GET | /api/tenants | Yes | Super Admin |

---

### 5.3 User Management APIs

| Method | Endpoint | Authentication | Role |
|------|---------|----------------|------|
| POST | /api/tenants/:tenantId/users | Yes | Tenant Admin |
| GET | /api/tenants/:tenantId/users | Yes | Tenant Admin / User |
| PUT | /api/users/:userId | Yes | Tenant Admin / Self |
| DELETE | /api/users/:userId | Yes | Tenant Admin |

---

### 5.4 Project Management APIs

| Method | Endpoint | Authentication | Role |
|------|---------|----------------|------|
| POST | /api/projects | Yes | Tenant Admin / User |
| GET | /api/projects | Yes | Tenant Admin / User |
| PUT | /api/projects/:projectId | Yes | Tenant Admin / Creator |
| DELETE | /api/projects/:projectId | Yes | Tenant Admin / Creator |

---

### 5.5 Task Management APIs

| Method | Endpoint | Authentication | Role |
|------|---------|----------------|------|
| POST | /api/projects/:projectId/tasks | Yes | Tenant Admin / User |
| GET | /api/projects/:projectId/tasks | Yes | Tenant Admin / User |
| PATCH | /api/tasks/:taskId/status | Yes | Tenant Admin / User |
| PUT | /api/tasks/:taskId | Yes | Tenant Admin / User |

---

All API endpoints enforce tenant-based filtering to ensure complete data isolation. Super administrator users bypass tenant filtering where required, while all other users are strictly limited to their assigned tenant.

