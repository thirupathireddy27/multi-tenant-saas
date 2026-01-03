# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application enabling organizations to register, manage teams, create projects, and track tasks. This project demonstrates strict data isolation, Role-Based Access Control (RBAC), and specific subscription limits.

## 🚀 Features

- **Multi-Tenancy**: Data isolation using `tenant_id` and subdomains.
- **Authentication**: Secure JWT-based auth with Role-Based Access Control (Super Admin, Tenant Admin, User).
- **Project Management**: Create, update, delete projects and tasks.
- **User Management**: Tenant admins can manage their organization's users.
- **Audit Logging**: Tracks critical system events.
- **Dockerized**: Fully containerized setup for Backend, Frontend, and Database.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React, Vite, Vanilla CSS
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker, Docker Compose

## 📦 Installation & Running

1. **Prerequisites**: Ensure Docker and Docker Compose are installed.
2. **Clone/Unzip** the repository.
3. **Run**:
   ```bash
   docker-compose up --build
   ```
4. **Access**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## 🔑 Test Credentials

**Super Admin**
- Email: `super@admin.com`
- Password: `supersecret`

**Tenant Admin** (Demo Tenant)
- Email: `admin@demo.com`
- Password: `password123`
- Subdomain: `demo`

**Regular User**
- Email: `user1@demo.com`
- Password: `password123`

## ❓ Troubleshooting

### 1. Database Connection Failed / Port 5432 Already Allocated
If you see errors like `Bind for 0.0.0.0:5432 failed`, it means another Postgres instance is running locally.
**Fix:**
```powershell
# Find the process ID (PID)
netstat -ano | findstr :5432
# Kill the process (Replace <PID> with the number found)
taskkill /F /PID <PID>
```
Then restart docker-compose.

### 2. Login Failed / Registration Failed
- Ensure the backend is fully started. Run `docker logs backend` and look for "✅ PostgreSQL is ready".
- If using the "Default Tenant", ensure you use the **Subdomain**: `default-tenant`.

### 3. Docker "Cannot find file specified"
This usually means Docker Desktop is not running or crashed.
**Fix:** Restart Docker Desktop application.

## 📚 Documentation

- [API Documentation](API_DOCS.md)
- [Architecture & Design](docs/architecture.md)
- [Walkthrough](walkthrough.md) (In artifacts)

## ✅ Submission Details

- `submission.json`: Contains project metadata and credentials.
- `API_DOCS.md`: Detailed API endpoints.
- Source Code: Complete `backend/` and `frontend/` directories.
- Database: `init-db.sh` and SQL scripts in `database/`.
