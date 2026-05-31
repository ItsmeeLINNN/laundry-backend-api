const bcrypt = require('bcrypt');
const db = require('../config/db');

// 1. Fitur Register Karyawan
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

// 2. Fitur Ambil Data Karyawan
exports.getKaryawan = (req, res) => {
    const sql = `SELECT id, nama, username, no_telepon, jabatan, hari_kerja, jam_masuk, jam_pulang, status_aktif FROM karyawan`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// 3. Fitur Login Karyawan
exports.login = (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM karyawan WHERE username = ?`;
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Username tidak terdaftar!" });
        }

        const user = results[0];

        if (!user.status_aktif) {
            return res.status(403).json({ error: "Akun ini sudah dinonaktifkan oleh Admin." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Password salah!" });
        }

        res.json({
            message: "Login berhasil",
            user: {
                id: user.id,
                nama: user.nama,
                jabatan: user.jabatan
            }
        });
    });
};