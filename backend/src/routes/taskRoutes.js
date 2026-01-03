const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const taskController = require('../controllers/taskController');

router.patch('/:taskId/status', verifyToken, taskController.updateTaskStatus);
router.put('/:taskId', verifyToken, taskController.updateTask);
router.delete('/:taskId', verifyToken, taskController.deleteTask);

module.exports = router;
