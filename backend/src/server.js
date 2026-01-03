const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Optional logger
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://frontend:3000'].filter(Boolean),
  credentials: true
}));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
// Tasks are often nested under projects, but we might need direct access or shared router logic
// The requirements specify: /api/projects/:projectId/tasks
// We can handle this in projectRoutes or a separate taskRoutes.
// Also /api/tasks/:taskId/status
app.use('/api/tasks', taskRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  const db = require('./config/db');
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health check db error', err);
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Export for testing
