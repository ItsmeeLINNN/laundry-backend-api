const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');

// Rute untuk membuat pesanan baru
router.post('/', pesananController.buatPesanan);

module.exports = router;