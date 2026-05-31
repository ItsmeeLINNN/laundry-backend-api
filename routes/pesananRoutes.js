const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');

// Endpoint untuk membuat pesanan baru
router.post('/', pesananController.buatPesanan);

// Endpoint untuk mengubah status lunas / selesai (menggunakan parameter ID)
router.put('/:id/status', pesananController.updateStatus);

module.exports = router;