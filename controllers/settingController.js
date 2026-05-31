const db = require('../config/db');

exports.updateSettings = (req, res) => {
    const { nama_laundry, alamat, telepon } = req.body;
    db.query("UPDATE settings SET nama_laundry=?, alamat=?, telepon=? WHERE id=1", 
             [nama_laundry, alamat, telepon], (err) => {
        if (err) return res.status(500).json({ error: "Gagal update setting" });
        res.json({ message: "Pengaturan berhasil diubah" });
    });
};