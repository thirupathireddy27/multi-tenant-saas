# Technical Specification

## Project Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/         # DB config, environment vars
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, Tenant Isolation, Error handling
│   ├── models/         # (Optional) DB Models if needed, or query builders
│   ├── routes/         # Express routes definitions
│   ├── utils/          # Helper functions (logger, formatting)
│   └── server.js       # Entry point
├── migrations/         # Database migration SQL files
├── seeds/              # Seed data SQL files
├── Dockerfile
├── package.json
└── .env
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (Dashboard, Login, etc.)
│   ├── services/       # API integration service
│   ├── context/        # Auth Context
│   └── App.jsx         # Main App component
├── public/
├── Dockerfile
├── package.json
└── vite.config.js
```

## Development Setup Guide

### Prerequisites
-   Node.js v18+
-   Docker & Docker Compose
-   PostgreSQL 15 (if running locally without Docker)

### Installation
1.  Clone the repository.
2.  Create `.env` files in `backend` and `root` (for docker-compose) based on examples.

### Running Locally (Docker - Recommended)
1.  Run `docker-compose up -d --build`.
2.  Access Frontend at `http://localhost:3000`.
3.  Access Backend API at `http://localhost:5000`.

### Running Tests
-   **API Tests**: Use the provided Postman collection or `check_submission.js` script (if available).
-   **Manual**: Log in with credentials from `submission.json`.
