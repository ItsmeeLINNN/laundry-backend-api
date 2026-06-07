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
        if (err) {
            console.error('GET /api/layanan error:', err);
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mengambil data layanan'
            });
        }

        res.json({
            status: 'SUKSES',
            data: results
        });
    });
});

// Menambah Layanan Baru
app.post('/api/layanan', (req, res) => {
    const { service_name, category, price, unit } = req.body;

    if (!service_name || !category || !price || !unit) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Nama layanan, kategori, harga, dan unit wajib diisi!'
        });
    }

    const serviceNameClean = String(service_name).trim();
    const categoryClean = String(category).trim();
    const unitClean = String(unit).trim();
    const priceNumber = Number(price);

    const serviceNameRegex = /^[A-Za-zÀ-ÿ0-9 ]{3,50}$/;
    const unitRegex = /^[A-Za-zÀ-ÿ ]{1,15}$/;

    if (!serviceNameRegex.test(serviceNameClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Nama layanan hanya boleh huruf, angka, dan spasi. Minimal 3 karakter.'
        });
    }

    if (!['Kiloan', 'Satuan'].includes(categoryClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Kategori layanan tidak valid.'
        });
    }

    if (!unitRegex.test(unitClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Unit hanya boleh huruf dan spasi.'
        });
    }

    if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Harga harus berupa angka lebih dari 0.'
        });
    }

    const sql = `
        INSERT INTO layanan (service_name, category, price, unit)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [serviceNameClean, categoryClean, priceNumber, unitClean], (err, result) => {
        if (err) {
            console.error('POST /api/layanan error:', err);

            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal menyimpan layanan baru'
            });
        }

        res.status(201).json({
            status: 'SUKSES',
            pesan: 'Layanan berhasil ditambahkan!',
            data: {
                id: result.insertId,
                service_name: serviceNameClean,
                category: categoryClean,
                price: priceNumber,
                unit: unitClean
            }
        });
    });
});

// Menghapus Layanan
app.delete('/api/layanan/:id', (req, res) => {
    const { id } = req.params;

    if (!/^[0-9]+$/.test(String(id))) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'ID layanan tidak valid.'
        });
    }

    db.query("DELETE FROM layanan WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error('DELETE /api/layanan/:id error:', err);

            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal menghapus layanan'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                pesan: 'Layanan tidak ditemukan.'
            });
        }

        res.json({
            status: 'SUKSES',
            pesan: 'Layanan berhasil dihapus!'
        });
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