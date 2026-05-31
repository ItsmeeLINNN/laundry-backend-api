const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint untuk mendaftarkan karyawan baru
router.post('/register', authController.register);

// Endpoint untuk mengambil data dan jadwal karyawan
router.get('/', authController.getKaryawan);

module.exports = router;