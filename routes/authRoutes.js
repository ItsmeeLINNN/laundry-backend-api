const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);

router.use(authenticateToken);

router.post('/register', requireRole('Admin'), authController.register);
router.get('/', requireRole('Admin'), authController.getKaryawan);
router.put('/:id', requireRole('Admin'), authController.updateKaryawan);
router.delete('/:id', requireRole('Admin'), authController.deleteKaryawan);

module.exports = router;
