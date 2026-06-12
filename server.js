require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { authenticateToken, requireRole } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const pesananRoutes = require('./routes/pesananRoutes');
const accessControlRoutes = require('./routes/accessControlRoutes');
const laporanController = require('./controllers/laporanController');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || 'https://laundry-frontend-app-chl.vercel.app';

app.use(cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: false
}));
app.use(express.json());

function healthHandler(req, res) {
    res.json({
        status: 'SUKSES',
        message: 'Backend Spincycle aktif.'
    });
}

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/karyawan', authRoutes);
app.use('/api', authenticateToken);

app.use('/api/access-control', accessControlRoutes);
app.use('/api/pesanan', pesananRoutes);

app.get('/api/dashboard', laporanController.getDashboard);
app.get('/api/laporan/ringkasan', requireRole('Admin'), laporanController.getRingkasan);
app.get('/api/laporan/detail', requireRole('Admin'), laporanController.getLaporanDetail);

app.get('/api/pengeluaran', requireRole('Admin'), (req, res) => {
    db.query('SELECT * FROM pengeluaran ORDER BY tanggal DESC, id DESC', (err, results) => {
        if (err) {
            console.error('GET /api/pengeluaran error:', err);
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mengambil data pengeluaran',
                message: 'Gagal mengambil data pengeluaran'
            });
        }

        res.json(results);
    });
});

app.post('/api/pengeluaran', requireRole('Admin'), (req, res) => {
    const { keterangan, nominal, tanggal } = req.body;

    if (!keterangan || !nominal || !tanggal) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Keterangan, nominal, dan tanggal wajib diisi!',
            message: 'Keterangan, nominal, dan tanggal wajib diisi!'
        });
    }

    const sql = 'INSERT INTO pengeluaran (keterangan, nominal, tanggal) VALUES (?, ?, ?)';
    db.query(sql, [String(keterangan).trim(), Number(nominal), tanggal], (err, result) => {
        if (err) {
            console.error('POST /api/pengeluaran error:', err);
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mencatat pengeluaran baru',
                message: 'Gagal mencatat pengeluaran baru'
            });
        }

        res.status(201).json({
            status: 'SUKSES',
            pesan: 'Pengeluaran berhasil dicatat!',
            message: 'Pengeluaran berhasil dicatat!',
            data: {
                id: result.insertId,
                keterangan: String(keterangan).trim(),
                nominal: Number(nominal),
                tanggal
            }
        });
    });
});

app.get('/api/pelanggan', (req, res) => {
    db.query('SELECT * FROM pelanggan ORDER BY name ASC', (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mengambil data pelanggan',
                message: 'Gagal mengambil data pelanggan'
            });
        }

        res.json({ status: 'SUKSES', data: results });
    });
});

app.post('/api/pelanggan', (req, res) => {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Nama dan Nomor HP wajib diisi!',
            message: 'Nama dan Nomor HP wajib diisi!'
        });
    }

    const sql = 'INSERT INTO pelanggan (name, phone, address) VALUES (?, ?, ?)';
    db.query(sql, [String(name).trim(), String(phone).trim(), address || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    status: 'GAGAL',
                    pesan: 'Nomor HP sudah terdaftar!',
                    message: 'Nomor HP sudah terdaftar!'
                });
            }

            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal menyimpan pelanggan baru',
                message: 'Gagal menyimpan pelanggan baru'
            });
        }

        res.status(201).json({
            status: 'SUKSES',
            pesan: 'Pelanggan berhasil ditambahkan!',
            message: 'Pelanggan berhasil ditambahkan!',
            data: { id: result.insertId }
        });
    });
});

app.put('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    const sql = 'UPDATE pelanggan SET name = ?, phone = ?, address = ? WHERE id = ?';

    db.query(sql, [String(name || '').trim(), String(phone || '').trim(), address || null, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mengubah data pelanggan',
                message: 'Gagal mengubah data pelanggan'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                pesan: 'Pelanggan tidak ditemukan.',
                message: 'Pelanggan tidak ditemukan.'
            });
        }

        res.json({
            status: 'SUKSES',
            pesan: 'Data pelanggan berhasil diperbarui!',
            message: 'Data pelanggan berhasil diperbarui!'
        });
    });
});

app.delete('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM pelanggan WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal menghapus pelanggan',
                message: 'Gagal menghapus pelanggan'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                pesan: 'Pelanggan tidak ditemukan.',
                message: 'Pelanggan tidak ditemukan.'
            });
        }

        res.json({
            status: 'SUKSES',
            pesan: 'Pelanggan berhasil dihapus!',
            message: 'Pelanggan berhasil dihapus!'
        });
    });
});

app.get('/api/layanan', (req, res) => {
    db.query('SELECT * FROM layanan ORDER BY category ASC, price ASC', (err, results) => {
        if (err) {
            console.error('GET /api/layanan error:', err);
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal mengambil data layanan',
                message: 'Gagal mengambil data layanan'
            });
        }

        res.json({
            status: 'SUKSES',
            data: results
        });
    });
});

app.post('/api/layanan', requireRole('Admin'), (req, res) => {
    const { service_name, category, price, unit } = req.body;

    if (!service_name || !category || !price || !unit) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Nama layanan, kategori, harga, dan unit wajib diisi!',
            message: 'Nama layanan, kategori, harga, dan unit wajib diisi!'
        });
    }

    const serviceNameClean = String(service_name).trim();
    const categoryClean = String(category).trim();
    const unitClean = String(unit).trim();
    const priceNumber = Number(price);

    if (!/^[A-Za-zÀ-ÿ0-9 ]{3,50}$/.test(serviceNameClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Nama layanan hanya boleh huruf, angka, dan spasi. Minimal 3 karakter.',
            message: 'Nama layanan hanya boleh huruf, angka, dan spasi. Minimal 3 karakter.'
        });
    }

    if (!['Kiloan', 'Satuan'].includes(categoryClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Kategori layanan tidak valid.',
            message: 'Kategori layanan tidak valid.'
        });
    }

    if (!/^[A-Za-zÀ-ÿ ]{1,15}$/.test(unitClean)) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Unit hanya boleh huruf dan spasi.',
            message: 'Unit hanya boleh huruf dan spasi.'
        });
    }

    if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'Harga harus berupa angka lebih dari 0.',
            message: 'Harga harus berupa angka lebih dari 0.'
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
                pesan: 'Gagal menyimpan layanan baru',
                message: 'Gagal menyimpan layanan baru'
            });
        }

        res.status(201).json({
            status: 'SUKSES',
            pesan: 'Layanan berhasil ditambahkan!',
            message: 'Layanan berhasil ditambahkan!',
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

app.delete('/api/layanan/:id', requireRole('Admin'), (req, res) => {
    const { id } = req.params;

    if (!/^[0-9]+$/.test(String(id))) {
        return res.status(400).json({
            status: 'GAGAL',
            pesan: 'ID layanan tidak valid.',
            message: 'ID layanan tidak valid.'
        });
    }

    db.query('DELETE FROM layanan WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('DELETE /api/layanan/:id error:', err);
            return res.status(500).json({
                status: 'ERROR',
                pesan: 'Gagal menghapus layanan',
                message: 'Gagal menghapus layanan'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                pesan: 'Layanan tidak ditemukan.',
                message: 'Layanan tidak ditemukan.'
            });
        }

        res.json({
            status: 'SUKSES',
            pesan: 'Layanan berhasil dihapus!',
            message: 'Layanan berhasil dihapus!'
        });
    });
});

app.put('/api/settings', requireRole('Admin'), (req, res) => {
    const { nama_laundry, alamat, telepon } = req.body;

    db.query(
        'UPDATE settings SET nama_laundry = ?, alamat = ?, telepon = ? WHERE id = 1',
        [nama_laundry, alamat, telepon],
        (err) => {
            if (err) {
                return res.status(500).json({
                    status: 'ERROR',
                    pesan: 'Gagal update settings',
                    message: 'Gagal update settings'
                });
            }

            res.json({
                status: 'SUKSES',
                pesan: 'Pengaturan berhasil diperbarui.',
                message: 'Pengaturan berhasil diperbarui.'
            });
        }
    );
});

app.use((req, res) => {
    res.status(404).json({
        status: 'GAGAL',
        message: 'Endpoint tidak ditemukan.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Backend Spincycle berjalan di port ${PORT}`);
});
