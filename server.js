const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const authRoutes = require('./routes/authRoutes');
const pesananRoutes = require('./routes/pesananRoutes');
const laporanController = require('./controllers/laporanController'); // Pastikan ini di atas agar bisa dipakai di route dashboard dan laporan

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// KONEKSI DATABASE RAILWAY
// ==========================================
const db = mysql.createPool({
    host: 'kodama.proxy.rlwy.net',
    user: 'root',
    password: 'MvHIXgtjhHZQdiujsuNMHDaDSudQppey',
    database: 'railway',
    port: 11020
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("GAGAL TERHUBUNG KE RAILWAY:", err.code, err.sqlMessage);
    } else {
        console.log("SUKSES! Berhasil terkoneksi ke Railway via Pool!");
        connection.release();
    }
});

// ==========================================
// 1. ROUTES MVC BARU (Login & Order Baru)
// ==========================================
// Kita serahkan urusan POST ke file routes terpisah agar tidak menumpuk di sini
const authRoutes = require('./routes/authRoutes');
const pesananRoutes = require('./routes/pesananRoutes');

app.use('/api/karyawan', authRoutes);
app.use('/api/pesanan', pesananRoutes); // Ini akan mengarah ke pesananController.js yang baru

// ==========================================
// 2. API MASTER DATA (PELANGGAN)
// ==========================================
app.get('/api/pelanggan', (req, res) => {
    const sql = "SELECT * FROM pelanggan ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil data pelanggan' });
        res.json({ status: 'SUKSES', data: results });
    });
});

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

app.put('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    const sql = "UPDATE pelanggan SET name = ?, phone = ?, address = ? WHERE id = ?";
    db.query(sql, [name, phone, address, id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengubah data pelanggan' });
        res.json({ status: 'SUKSES', pesan: 'Data pelanggan berhasil diperbarui!' });
    });
});

app.delete('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM pelanggan WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menghapus pelanggan' });
        res.json({ status: 'SUKSES', pesan: 'Pelanggan berhasil dihapus!' });
    });
});

// ==========================================
// 3. API MASTER DATA (LAYANAN)
// ==========================================
app.get('/api/layanan', (req, res) => {
    db.query("SELECT * FROM layanan ORDER BY category ASC, price ASC", (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil data layanan' });
        res.json({ status: 'SUKSES', data: results });
    });
});

app.post('/api/layanan', (req, res) => {
    const { service_name, category, price, unit, estimated_days } = req.body;
    if (!service_name || !price || !unit) return res.status(400).json({ status: 'GAGAL', pesan: 'Data tidak lengkap!' });

    const sql = "INSERT INTO layanan (service_name, category, price, unit, estimated_days) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [service_name, category, price, unit, estimated_days || 1], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menyimpan layanan baru' });
        res.json({ status: 'SUKSES', pesan: 'Layanan baru berhasil ditambahkan!' });
    });
});

app.delete('/api/layanan/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM layanan WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menghapus layanan' });
        res.json({ status: 'SUKSES', pesan: 'Layanan berhasil dihapus!' });
    });
});

// ==========================================
// 4. API RIWAYAT PESANAN (GET & PUT Status)
// ==========================================
app.get('/api/pesanan', (req, res) => {
    const sql = `
        SELECT p.id, p.pelanggan_id, p.status_pesanan, p.total_harga, p.tanggal_masuk,
               c.name AS nama_pelanggan, c.phone AS no_hp
        FROM pesanan p
        JOIN pelanggan c ON p.pelanggan_id = c.id
        ORDER BY p.tanggal_masuk DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil riwayat pesanan' });
        res.json({ status: 'SUKSES', data: results });
    });
});

app.put('/api/pesanan/:id/status', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE pesanan SET status_pesanan = 'Selesai' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengubah status pesanan' });
        res.json({ status: 'SUKSES', pesan: 'Status pesanan berhasil diperbarui!' });
    });
});

const laporanController = require('./controllers/laporanController');

app.get('/api/dashboard', laporanController.getDashboard);
app.get('/api/laporan/ringkasan', laporanController.getRingkasan);
app.get('/api/laporan/detail', laporanController.getLaporanDetail);

// ==========================================
// JALANKAN SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend Spincycle berjalan di port ${PORT}`);
});