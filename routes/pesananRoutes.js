const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');

// 1. Rute untuk membuat pesanan baru (POST)
router.post('/', pesananController.buatPesanan);

// 2. Rute untuk mengambil daftar pesanan (GET) - INI YANG TADI HILANG
router.get('/', pesananController.getListPesanan);

// 3. Rute untuk mengubah status pesanan (PUT)
router.put('/:id/status', pesananController.updateStatus);

module.exports = router;