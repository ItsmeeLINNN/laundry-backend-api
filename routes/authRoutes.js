const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.get('/', authController.getKaryawan);

// Tambahkan baris ini untuk rute login
router.post('/login', authController.login);

module.exports = router;