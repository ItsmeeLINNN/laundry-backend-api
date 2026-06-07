const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.get('/', authController.getKaryawan);
router.post('/login', authController.login);

router.put('/:id', authController.updateKaryawan);
router.delete('/:id', authController.deleteKaryawan);

module.exports = router;