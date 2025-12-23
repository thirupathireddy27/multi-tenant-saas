# Technical Specification
## Multi-Tenant SaaS Platform – Project & Task Management System

## 1. Project Structure

### 1.1 Backend Folder Structure

The backend application follows a modular and scalable folder structure to support a production-ready multi-tenant SaaS platform. Each folder has a clear responsibility, ensuring separation of concerns, maintainability, and ease of testing.

backend/
├── src/
│ ├── app.js
│ ├── server.js
│ ├── config/
│ │ ├── database.js
│ │ └── env.js
│ ├── models/
│ │ ├── tenant.model.js
│ │ ├── user.model.js
│ │ ├── project.model.js
│ │ ├── task.model.js
│ │ └── auditLog.model.js
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── tenant.controller.js
│ │ ├── user.controller.js
│ │ ├── project.controller.js
│ │ └── task.controller.js
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── tenant.routes.js
│ │ ├── user.routes.js
│ │ ├── project.routes.js
│ │ └── task.routes.js
│ ├── middleware/
│ │ ├── auth.middleware.js
│ │ ├── role.middleware.js
│ │ ├── tenant.middleware.js
│ │ └── error.middleware.js
│ ├── services/
│ │ ├── auth.service.js
│ │ ├── audit.service.js
│ │ └── subscription.service.js
│ ├── utils/
│ │ ├── jwt.util.js
│ │ ├── password.util.js
│ │ └── response.util.js
│ └── validators/
│ ├── auth.validator.js
│ ├── tenant.validator.js
│ ├── user.validator.js
│ ├── project.validator.js
│ └── task.validator.js
│
├── migrations/
│ ├── 001_create_tenants.sql
│ ├── 002_create_users.sql
│ ├── 003_create_projects.sql
│ ├── 004_create_tasks.sql
│ └── 005_create_audit_logs.sql
│
├── seeds/
│ └── seed_data.sql
│
├── Dockerfile
├── package.json
├── package-lock.json
└── .env


---

### Folder Responsibilities

- **src/**  
  Contains the core backend application logic.

- **config/**  
  Handles database connections, environment variable loading, and application configuration.

- **models/**  
  Defines database models corresponding to core entities such as tenants, users, projects, tasks, and audit logs.

- **controllers/**  
  Contains request-handling logic for each API endpoint. Controllers receive validated input and delegate business logic to services.

- **routes/**  
  Defines API route mappings and connects endpoints to their respective controllers.

- **middleware/**  
  Includes authentication, authorization, tenant isolation, and centralized error-handling middleware.

- **services/**  
  Encapsulates reusable business logic such as authentication handling, audit logging, and subscription enforcement.

- **utils/**  
  Contains utility functions for JWT handling, password hashing, and standardized API responses.

- **validators/**  
  Performs request validation to ensure data integrity and prevent invalid or malicious input.

- **migrations/**  
  Contains ordered SQL migration files used to initialize and evolve the database schema.

- **seeds/**  
  Stores seed scripts used to populate the database with initial test data.

- **Dockerfile**  
  Defines the container build process for the backend service.

### 1.2 Frontend Folder Structure

The frontend application is built using React and follows a component-based architecture. The folder structure is designed to promote reusability, clear separation of concerns, and easy scalability as the application grows.

frontend/
├── public/
│ └── index.html
│
├── src/
│ ├── index.js
│ ├── App.js
│ ├── App.css
│ │
│ ├── api/
│ │ ├── apiClient.js
│ │ ├── auth.api.js
│ │ ├── tenant.api.js
│ │ ├── user.api.js
│ │ ├── project.api.js
│ │ └── task.api.js
│ │
│ ├── components/
│ │ ├── common/
│ │ │ ├── Navbar.js
│ │ │ ├── Sidebar.js
│ │ │ ├── ProtectedRoute.js
│ │ │ ├── Loader.js
│ │ │ └── ErrorMessage.js
│ │ │
│ │ ├── auth/
│ │ │ ├── LoginForm.js
│ │ │ └── RegisterForm.js
│ │ │
│ │ ├── projects/
│ │ │ ├── ProjectList.js
│ │ │ ├── ProjectCard.js
│ │ │ ├── ProjectForm.js
│ │ │ └── ProjectDetails.js
│ │ │
│ │ ├── tasks/
│ │ │ ├── TaskList.js
│ │ │ ├── TaskCard.js
│ │ │ ├── TaskForm.js
│ │ │ └── TaskStatusUpdater.js
│ │ │
│ │ └── users/
│ │ ├── UserList.js
│ │ ├── UserForm.js
│ │ └── UserCard.js
│ │
│ ├── pages/
│ │ ├── LoginPage.js
│ │ ├── RegisterPage.js
│ │ ├── DashboardPage.js
│ │ ├── ProjectsPage.js
│ │ ├── ProjectDetailsPage.js
│ │ └── UsersPage.js
│ │
│ ├── context/
│ │ └── AuthContext.js
│ │
│ ├── hooks/
│ │ └── useAuth.js
│ │
│ ├── utils/
│ │ ├── authStorage.js
│ │ └── constants.js
│ │
│ └── styles/
│ └── main.css
│
├── Dockerfile
├── package.json
└── package-lock.json


---

### Folder Responsibilities

- **public/**  
  Contains static files such as the base HTML file used by React.

- **src/**  
  Contains the entire frontend application logic.

- **api/**  
  Centralized API service layer responsible for communicating with backend endpoints.

- **components/**  
  Reusable UI components grouped by feature and functionality.

- **pages/**  
  Page-level components mapped to application routes.

- **context/**  
  Manages global application state such as authentication and user details.

- **hooks/**  
  Custom React hooks for reusable logic like authentication handling.

- **utils/**  
  Helper utilities for token storage, constants, and shared logic.

- **styles/**  
  Global and shared styling files.

- **Dockerfile**  
  Defines the container build and runtime process for the frontend application.

---

# Technical Specification

## Multi-Tenant SaaS Platform – Project & Task Management System

---

## 1.3 Database & Migration Structure

The application uses PostgreSQL as the relational database. Database schema management is handled using SQL-based migration files to ensure consistency and repeatability across environments.

```
database/
├── migrations/
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   └── 005_create_audit_logs.sql
│
└── seeds/
    └── seed_data.sql
```

* **migrations/**: Ordered SQL files to create and evolve the database schema. Executed automatically during backend startup.
* **seeds/**: Initial data for evaluation (super admin, demo tenant, users, projects, tasks).

---

## 2. Development Setup Guide

### 2.1 Prerequisites

* Node.js (v18 or above)
* npm
* Docker & Docker Compose
* Git
* Modern web browser

---

### 2.2 Environment Variables

All configuration is provided via environment variables (committed with test/development values).

```
DB_HOST=database
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://frontend:3000
```

---

### 2.3 Local Development Setup (Optional)

```
git clone <repository-url>
cd multi-tenant-saas

cd backend
npm install

cd ../frontend
npm install

# start backend
npm start

# start frontend
npm start
```

---

### 2.4 Docker-Based Setup (Recommended)

Run the entire system with one command:

```
docker-compose up -d
```

Services and ports:

* Database: [http://localhost:5432](http://localhost:5432)
* Backend: [http://localhost:5000](http://localhost:5000)
* Frontend: [http://localhost:3000](http://localhost:3000)

---

### 2.5 Migrations & Seed Data

* Migrations and seed data run **automatically** when the backend container starts
* No manual commands required
* System is ready for evaluation immediately after startup

---

### 2.6 Health Check

Endpoint:

```
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Confirms backend availability, database connectivity, and successful initialization.
