const db = require('../config/db');

exports.getRingkasan = (req, res) => {
    // Menghitung total bulan ini secara otomatis
    const sql = `
        SELECT 
            COUNT(id) AS total_transaksi,
            SUM(total_bayar) AS total_pendapatan,
            SUM(CASE WHEN is_selesai = 1 THEN 1 ELSE 0 END) AS pesanan_selesai,
            SUM(CASE WHEN is_selesai = 0 THEN 1 ELSE 0 END) AS pesanan_belum_selesai
        FROM pesanan 
        WHERE MONTH(tgl_masuk) = MONTH(CURRENT_DATE()) AND YEAR(tgl_masuk) = YEAR(CURRENT_DATE())
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};