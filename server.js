const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// ROUTES / ENDPOINTS
// ==========================================

// 1. Endpoint Dasar (Cek Server)
app.get('/', (req, res) => {
    res.json({ pesan: 'API Laundry & Linen Backend Berjalan Sempurna!' });
});

// 2. Endpoint: Mengambil Katalog Layanan (GET)
app.get('/api/layanan', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vw_active_prices');
        res.status(200).json({
            status: 'SUKSES',
            jumlah_data: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error saat mengambil data layanan:', error);
        res.status(500).json({ status: 'ERROR', pesan: 'Terjadi kesalahan internal server' });
    }
});

// 3. Endpoint: Tambah Pelanggan Baru (POST)
app.post('/api/pelanggan', async (req, res) => {
    try {
        const { name, phone, address, email } = req.body;

        // Panggil Stored Procedure dari database
        const [result] = await db.query(
            'CALL sp_add_customer(?, ?, ?, ?)', 
            [name, phone, address, email]
        );

        res.status(201).json({
            status: 'SUKSES',
            pesan: 'Data pelanggan berhasil disimpan ke database!',
            hasil_db: result[0]
        });
    } catch (error) {
        console.error('Error saat menambah pelanggan:', error);
        res.status(500).json({ status: 'ERROR', pesan: 'Gagal menyimpan data ke database' });
    }
});


//API CRUD PELANGGAN (customers)
// 1. READ: Ambil Semua Data Pelanggan
app.get('/api/pelanggan', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.status(200).json({ status: 'SUKSES', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 2. CREATE: Tambah Pelanggan Baru
app.post('/api/pelanggan', async (req, res) => {
    try {
        const { name, phone, address, email } = req.body;
        const query = 'INSERT INTO customers (name, phone, address, email) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [name, phone, address, email]);
        
        res.status(201).json({ status: 'SUKSES', pesan: 'Pelanggan berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 3. UPDATE: Edit Data Pelanggan
app.put('/api/pelanggan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, email } = req.body;
        const query = 'UPDATE customers SET name=?, phone=?, address=?, email=? WHERE customer_id=?';
        await db.query(query, [name, phone, address, email, id]);
        
        res.status(200).json({ status: 'SUKSES', pesan: 'Data pelanggan berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 4. DELETE: Hapus Pelanggan
app.delete('/api/pelanggan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM customers WHERE customer_id=?', [id]);
        res.status(200).json({ status: 'SUKSES', pesan: 'Pelanggan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});


//API CRUD LAYANAN (services)
// 1. READ: Ambil Semua Layanan
app.get('/api/layanan', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM services ORDER BY service_name ASC');
        res.status(200).json({ status: 'SUKSES', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 2. CREATE: Tambah Layanan Baru (Harga & Estimasi)
app.post('/api/layanan', async (req, res) => {
    try {
        const { service_name, category, estimated_days } = req.body;
        const query = 'INSERT INTO services (service_name, category, estimated_days) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [service_name, category, estimated_days]);
        
        res.status(201).json({ status: 'SUKSES', pesan: 'Layanan berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 3. UPDATE: Edit Layanan
app.put('/api/layanan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, category, estimated_days } = req.body;
        const query = 'UPDATE services SET service_name=?, category=?, estimated_days=? WHERE service_id=?';
        await db.query(query, [service_name, category, estimated_days, id]);
        
        res.status(200).json({ status: 'SUKSES', pesan: 'Layanan berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

// 4. DELETE: Hapus Layanan
app.delete('/api/layanan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM services WHERE service_id=?', [id]);
        res.status(200).json({ status: 'SUKSES', pesan: 'Layanan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', pesan: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});