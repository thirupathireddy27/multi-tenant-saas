const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const userController = require('../controllers/userController');

// Note: Create and List users are in tenantRoutes.js

router.put('/:userId', verifyToken, userController.updateUser);
router.delete('/:userId', verifyToken, userController.deleteUser);

module.exports = router;
