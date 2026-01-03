const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const tenantController = require('../controllers/tenantController');
const userController = require('../controllers/userController');

router.get('/', verifyToken, tenantController.listTenants);
router.get('/:tenantId', verifyToken, tenantController.getTenant);
router.put('/:tenantId', verifyToken, tenantController.updateTenant);

// Tenant Users
router.post('/:tenantId/users', verifyToken, userController.addUser);
router.get('/:tenantId/users', verifyToken, userController.listTenantUsers);

module.exports = router;
