# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register Tenant
- **Endpoint**: `POST /auth/register-tenant`
- **Body**:
  ```json
  {
    "tenantName": "Acme Corp",
    "subdomain": "acme",
    "adminEmail": "admin@acme.com",
    "adminPassword": "password",
    "adminFullName": "Admin User"
  }
  ```

### Login
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "admin@acme.com",
    "password": "password",
    "tenantSubdomain": "acme" 
  }
  ```
- **Response**: Returns JWT Token.

### Get Me
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`

### Logout
- **Endpoint**: `POST /auth/logout`

---

## Tenants

### List Tenants (Super Admin)
- **Endpoint**: `GET /tenants`

### Get Tenant
- **Endpoint**: `GET /tenants/:id`

### Update Tenant
- **Endpoint**: `PUT /tenants/:id`

### Add User to Tenant
- **Endpoint**: `POST /tenants/:id/users`
- **Body**:
  ```json
  {
    "email": "user@acme.com",
    "password": "password",
    "fullName": "John Doe",
    "role": "user"
  }
  ```

### List Tenant Users
- **Endpoint**: `GET /tenants/:id/users`

---

## Projects

### Create Project
- **Endpoint**: `POST /projects`
- **Body**:
  ```json
  {
    "name": "New Project",
    "description": "Description"
  }
  ```

### List Projects
- **Endpoint**: `GET /projects`

### Get Project Details
- **Endpoint**: `GET /projects/:id`

### Update Project
- **Endpoint**: `PUT /projects/:id`

### Delete Project
- **Endpoint**: `DELETE /projects/:id`

---

## Tasks

### Create Task
- **Endpoint**: `POST /projects/:projectId/tasks`
- **Body**:
  ```json
  {
    "title": "Task 1",
    "description": "Do something",
    "priority": "medium",
    "assignedTo": "user-uuid"
  }
  ```

### List Tasks
- **Endpoint**: `GET /projects/:projectId/tasks`

### Update Task
- **Endpoint**: `PUT /tasks/:taskId`

### Update Task Status
- **Endpoint**: `PATCH /tasks/:taskId/status`
- **Body**: `{"status": "in_progress"}`
