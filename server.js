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

// Menambah Pelanggan Baru (POST)
app.post('/api/pelanggan', (req, res) => {
    const { name, phone, address } = req.body;
    if (!name || !phone) return res.status(400).json({ status: 'GAGAL', pesan: 'Nama dan Nomor HP wajib diisi!' });

    const sql = "INSERT INTO pelanggan (name, phone, address) VALUES (?, ?, ?)";
    db.query(sql, [name, phone, address], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'GAGAL', pesan: 'Nomor HP sudah terdaftar!' });
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menyimpan pelanggan baru' });
        }
        res.json({ status: 'SUKSES', pesan: 'Pelanggan berhasil ditambahkan!' });
    });
});

// Mengubah Data Pelanggan (PUT)
app.put('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    const sql = "UPDATE pelanggan SET name = ?, phone = ?, address = ? WHERE id = ?";
    db.query(sql, [name, phone, address, id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengubah data pelanggan' });
        res.json({ status: 'SUKSES', pesan: 'Data pelanggan berhasil diperbarui!' });
    });
});

// Menghapus Pelanggan (DELETE)
app.delete('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM pelanggan WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menghapus pelanggan' });
        res.json({ status: 'SUKSES', pesan: 'Pelanggan berhasil dihapus!' });
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