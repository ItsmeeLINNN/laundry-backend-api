const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');

// Endpoint untuk mengambil ringkasan total pendapatan dan transaksi
router.get('/ringkasan', laporanController.getRingkasan);

module.exports = router;