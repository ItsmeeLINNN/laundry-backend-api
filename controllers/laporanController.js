const db = require('../config/db');

// A. Dashboard Utama (Ringkasan cepat untuk Karyawan & Admin)
exports.getDashboard = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
        SELECT 
            (SELECT SUM(total_harga) FROM pesanan WHERE DATE(tanggal_masuk) = ?) as pendapatan,
            (SELECT COUNT(*) FROM pesanan WHERE status_pesanan = 'Diproses') as proses,
            (SELECT COUNT(*) FROM pesanan WHERE status_pesanan = 'Selesai' AND DATE(tanggal_masuk) = ?) as selesai,
            (SELECT COUNT(*) FROM pelanggan) as pelanggan
    `;
    db.query(sql, [today, today], (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', message: "Gagal ambil dashboard" });
        res.json({ status: 'SUKSES', data: results[0] });
    });
};

// B. Ringkasan Laporan (Aggregated: Harian/Mingguan/Bulanan)
exports.getRingkasan = (req, res) => {
    const { filter } = req.query;
    // Validasi filter agar aman dari SQL Injection
    const intervalMap = { 'harian': '1 DAY', 'mingguan': '7 DAY', 'bulanan': '30 DAY' };
    const interval = intervalMap[filter] || '1 DAY'; 
    
    const sql = `SELECT COUNT(*) as total_pesanan, SUM(total_harga) as pendapatan 
                 FROM pesanan WHERE tanggal_masuk >= DATE_SUB(NOW(), INTERVAL ${interval})`;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', message: "Gagal ambil ringkasan" });
        res.json({ status: 'SUKSES', data: results[0] });
    });
};

// C. Laporan Detail (Granular: List Transaksi untuk Admin)
exports.getLaporanDetail = (req, res) => {
    const { filter } = req.query;
    const intervalMap = { 'harian': '1 DAY', 'mingguan': '7 DAY', 'bulanan': '30 DAY' };
    const interval = intervalMap[filter] || '1 DAY';

    const sql = `SELECT p.*, c.name as nama_pelanggan 
                 FROM pesanan p 
                 JOIN pelanggan c ON p.pelanggan_id = c.id 
                 WHERE p.tanggal_masuk >= DATE_SUB(NOW(), INTERVAL ${interval})
                 ORDER BY p.tanggal_masuk DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', message: "Gagal ambil detail laporan" });
        res.json({ status: 'SUKSES', data: results });
    });
};