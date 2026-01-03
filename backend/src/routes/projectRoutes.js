const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');

// Projects
router.post('/', verifyToken, projectController.createProject);
router.get('/', verifyToken, projectController.listProjects);
router.get('/:projectId', verifyToken, projectController.getProject);
router.put('/:projectId', verifyToken, projectController.updateProject);
router.delete('/:projectId', verifyToken, projectController.deleteProject);

// Nested Tasks
router.post('/:projectId/tasks', verifyToken, taskController.createTask);
router.get('/:projectId/tasks', verifyToken, taskController.listProjectTasks);

module.exports = router;
