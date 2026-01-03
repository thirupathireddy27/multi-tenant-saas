# Research & Requirements Analysis

## Multi-Tenancy Analysis

Multi-tenancy is a software architecture where a single instance of software serves multiple tenants. 

### Comparison of Approaches

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same database and tables. Data is isolated via a `tenant_id` discriminator column. | • **Lowest Cost**: Single database instance.<br>• **Easy Maintenance**: Schema updates apply to all tenants instantly.<br>• **Scalability**: Can handle high density of small tenants efficiently. | • **Data Isolation Risk**: Developers must ensure `tenant_id` filter is always applied.<br>• **Performance**: "Noisy neighbor" effect; indexes can get large.<br>• **Backup/Restore**: Hard to backup/restore a specific tenant individually. |
| **Shared Database, Separate Schemas** | Tenants share a database but have their own schemas (namespace). | • **Better Isolation**: Data is logically separated at database level.<br>• **Customization**: Easier to support per-tenant schema extensions.<br>• **Backup**: Easier to backup per schema. | • **Complexity**: Migration scripts must run N times.<br>• **Resource Overhead**: Higher memory usage for database metadata.<br>• **Scalability Limits**: Databases have limits on number of schemas/tables. |
| **Separate Databases** | Each tenant has their own dedicated database instance. | • **Highest Isolation**: Physical separation of data.<br>• **Security**: Breach of one DB doesn't expose others.<br>• **Performance**: True isolation of resources. | • **Highest Cost**: More infrastructure resources.<br>• **Operational Complexity**: Managing N database connections and backups.<br>• **Deployment**: Rolling out updates is very slow and complex. |

### Chosen Approach: Shared Database, Shared Schema
For this project, we have chosen **Shared Database + Shared Schema** with `tenant_id` isolation.
**Justification**:
1.  **Complexity vs Time**: Given the tight deadline, this is the fastest to implement.
2.  **Resource Efficiency**: We are running everything in Docker containers; a single Postgres instance is efficient.
3.  **Modern tooling**: ORMs and middleware make it easier to enforce `tenant_id` filtering, mitigating the isolation risk.
4.  **Requirements**: The project requirements explicitly mention "Tenant Identification: Every data record... must be associated with a tenant via tenant_id", which strongly points to this model.

## Technology Stack Justification

### Backend Framework: **Node.js with Express**
-   **Why**: Non-blocking I/O is ideal for real-time SaaS applications. Huge ecosystem of middleware (like `cors`, `helmet`, `morgan`) speeds up development.
-   **Alternatives**: Python/Django (too heavy), Go (slower development speed for this specific task).

### Frontend Framework: **React**
-   **Why**: Component-based architecture is perfect for valid dashboards (Projects, Tasks).
-   **Alternatives**: Vue (good, but React has better TypeScript support if we used it), Angular (too much boilerplate).

### Database: **PostgreSQL**
-   **Why**: Reliable, compliant, acts as a relational backbone. Supports JSONB if we need flexibility.
-   **Alternatives**: MongoDB (NoSQL not ideal for structured relational data like Tenants -> Projects -> Tasks).

### Authentication: **JWT (JSON Web Tokens)**
-   **Why**: Stateless. Fits perfectly with the REST API model. No server-side session storage required (though optional session table is mentioned).
-   **Alternatives**: Session-based auth (requires Redis/Database lookup on every request, harder to scale).

## Security Considerations

1.  **Tenant Isolation**: We implement a middleware that extracts `tenantId` from the JWT and injects it into every database query. This ensures a user can *never* query data outside their tenant.
2.  **Role-Based Access Control (RBAC)**: Middleware checks `user.role` (Super Admin, Tenant Admin, User) against allowed roles for each endpoint.
3.  **Data encryption**: All passwords are hashed using **bcrypt** before storage.
4.  **API Security**:
    -   **CORS**: Restricted to the frontend domain.
    -   **Input Validation**: Strict validation of request bodies to prevent Injection attacks.
5.  **Audit Logging**: Critical actions (Create/Update/Delete) are logged to `audit_logs` table for accountability.
