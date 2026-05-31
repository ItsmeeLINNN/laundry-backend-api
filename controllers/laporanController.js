const db = require('../config/db');

exports.getRingkasan = (req, res) => {
    const { filter } = req.query; // 'harian', 'mingguan', 'bulanan'
    let interval = filter === 'mingguan' ? '7 DAY' : (filter === 'bulanan' ? '30 DAY' : '1 DAY');
    
    const sql = `SELECT COUNT(*) as total_pesanan, SUM(total_harga) as pendapatan 
                 FROM pesanan WHERE tanggal_masuk >= DATE_SUB(NOW(), INTERVAL ${interval})`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Gagal ambil laporan" });
        res.json(results[0]);
    });
};