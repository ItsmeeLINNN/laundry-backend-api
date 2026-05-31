const bcrypt = require('bcrypt');
const db = require('../config/db'); // Sesuaikan dengan file koneksi database-mu

// Register Karyawan Baru
exports.register = async (req, res) => {
    const { nama, username, password, no_telepon, alamat, jabatan, hari_kerja, jam_masuk, jam_pulang } = req.body;
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO karyawan (nama, username, password, no_telepon, alamat, jabatan, hari_kerja, jam_masuk, jam_pulang) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sql, [nama, username, hashPassword, no_telepon, alamat, jabatan, hari_kerja, jam_masuk, jam_pulang], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Karyawan berhasil didaftarkan" });
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal memproses pendaftaran" });
    }
};

// Lihat Data Karyawan (Jadwal Kerja)
exports.getKaryawan = (req, res) => {
    const sql = `SELECT id, nama, username, no_telepon, jabatan, hari_kerja, jam_masuk, jam_pulang, status_aktif FROM karyawan`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};