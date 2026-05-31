const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// KONEKSI DATABASE
// ==========================================
const db = mysql.createPool({
    host: 'kodama.proxy.rlwy.net',
    user: 'root',
    password: 'MvHIXgtjhHZQdiujsuNMHDaDSudQppey',
    database: 'railway',
    port: 11020
});

// ==========================================
// IMPOR ROUTES & CONTROLLERS (SATU KALI SAJA)
// ==========================================
const authRoutes = require('./routes/authRoutes');
const pesananRoutes = require('./routes/pesananRoutes');
const laporanController = require('./controllers/laporanController');

// ==========================================
// ROUTES MIDDLEWARE
// ==========================================
app.use('/api/karyawan', authRoutes);
app.use('/api/pesanan', pesananRoutes);

// ==========================================
// API LAPORAN (Dashboard & Detail)
// ==========================================
app.get('/api/dashboard', laporanController.getDashboard);
app.get('/api/laporan/ringkasan', laporanController.getRingkasan);
app.get('/api/laporan/detail', laporanController.getLaporanDetail);

// ==========================================
// API MASTER DATA (Sisa Fitur)
// ==========================================
// Pelanggan
app.get('/api/pelanggan', (req, res) => {
    db.query("SELECT * FROM pelanggan ORDER BY name ASC", (err, results) => {
        if (err) return res.status(500).json({ error: "Gagal" });
        res.json({ status: 'SUKSES', data: results });
    });
});

// Layanan
app.get('/api/layanan', (req, res) => {
    db.query("SELECT * FROM layanan ORDER BY category ASC, price ASC", (err, results) => {
        if (err) return res.status(500).json({ error: "Gagal" });
        res.json({ status: 'SUKSES', data: results });
    });
});

// Settings
app.put('/api/settings', (req, res) => {
    const { nama_laundry, alamat, telepon } = req.body;
    db.query("UPDATE settings SET nama_laundry=?, alamat=?, telepon=? WHERE id=1", 
             [nama_laundry, alamat, telepon], (err) => {
        if (err) return res.status(500).json({ error: "Gagal update" });
        res.json({ message: "Pengaturan berhasil" });
    });
});

// ==========================================
// JALANKAN SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend Spincycle berjalan di port ${PORT}`);
});