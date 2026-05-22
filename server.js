const express = require('express');
const cors = require('cors');
app.use(cors()); // Ini akan mengizinkan semua domain untuk mengakses backend-mu
const mysql = require('mysql2')

const app = express();
app.use(cors());
app.use(express.json());

//testing koneksi ke database cloud railway
const db = mysql.createPool({
    host: 'kodama.proxy.rlwy.net', // Contoh host dari Railway
    user: 'root', // User dari Railway
    password: 'MvHIXgtjhHZQdiujsuNMHDaDSudQppey', // Password dari Railway
    database: 'railway', // Nama DB default dari railway
    port: 11020 // Port dari Railway
});

// Alat Pendeteksi Koneksi Pool
db.getConnection((err, connection) => {
    if (err) {
        console.error("GAGAL TERHUBUNG KE RAILWAY. Penyebabnya:", err.code, err.sqlMessage);
    } else {
        console.log("SUKSES! Berhasil terkoneksi ke Railway via Pool!");
        connection.release();
    }
});

// ==========================================
// API LOGIN (REAL DATABASE & RBAC)
// ==========================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: 'GAGAL', pesan: 'Username dan password wajib diisi!' });
    }

    const sql = "SELECT fullname, role, is_active FROM users WHERE username = ? AND password = ?";
    
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Terjadi kesalahan pada server.' });
        }

        if (results.length > 0) {
            const user = results[0];

            if (user.is_active === 'false') {
                return res.status(403).json({ status: 'GAGAL', pesan: 'Akses Ditolak: Akun dinonaktifkan!' });
            }

            res.json({
                status: 'SUKSES',
                pesan: 'Login berhasil!',
                data: {
                    fullname: user.fullname,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ status: 'GAGAL', pesan: 'Username atau Password salah!' });
        }
    });
});

// ==========================================
// API PELANGGAN (MASTER DATA)
// ==========================================

// 1. Mengambil Daftar Pelanggan (READ)
app.get('/api/pelanggan', (req, res) => {
    const sql = "SELECT * FROM pelanggan ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil data pelanggan' });
        }
        res.json({ status: 'SUKSES', data: results });
    });
});

// 2. Menambah Pelanggan Baru (CREATE)
app.post('/api/pelanggan', (req, res) => {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ status: 'GAGAL', pesan: 'Nama dan Nomor HP wajib diisi!' });
    }

    const sql = "INSERT INTO pelanggan (name, phone, address) VALUES (?, ?, ?)";
    db.query(sql, [name, phone, address], (err, result) => {
        if (err) {
            console.error(err);
            // Error code 1062 biasanya karena nomor HP sudah ada (UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ status: 'GAGAL', pesan: 'Nomor HP ini sudah terdaftar!' });
            }
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menyimpan pelanggan baru' });
        }
        res.json({ status: 'SUKSES', pesan: 'Pelanggan berhasil ditambahkan!' });
    });
});

// 3. Mengubah Data Pelanggan (UPDATE)
app.put('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ status: 'GAGAL', pesan: 'Nama dan Nomor HP wajib diisi!' });
    }

    const sql = "UPDATE pelanggan SET name = ?, phone = ?, address = ? WHERE id = ?";
    db.query(sql, [name, phone, address, id], (err, result) => {
        if (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ status: 'GAGAL', pesan: 'Nomor HP ini sudah dipakai pelanggan lain!' });
            }
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengubah data pelanggan' });
        }
        res.json({ status: 'SUKSES', pesan: 'Data pelanggan berhasil diperbarui!' });
    });
});

// 4. Menghapus Pelanggan (DELETE)
app.delete('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = "DELETE FROM pelanggan WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menghapus pelanggan' });
        }
        res.json({ status: 'SUKSES', pesan: 'Pelanggan berhasil dihapus dari sistem!' });
    });
});

// ==========================================
// API TRANSAKSI (ORDER BARU) - VERSI FULL DATABASE
// ==========================================
app.post('/api/pesanan', (req, res) => {
    // Menangkap data lengkap dari frontend
    const { pelanggan_id, nama_kasir, metode_pembayaran, total_tagihan, uang_diterima, uang_kembalian, keranjang } = req.body;

    if (!pelanggan_id || !total_tagihan || !keranjang || keranjang.length === 0) {
        return res.status(400).json({ status: 'GAGAL', pesan: 'Data transaksi tidak lengkap!' });
    }

    // Generate Nomor Nota unik (Misal: ORD-1715839201)
    const nomor_nota = `ORD-${Math.floor(Date.now() / 1000)}`;

    // 1. Cari ID Kasir berdasarkan nama yang login
    db.query("SELECT id FROM users WHERE fullname = ? LIMIT 1", [nama_kasir], (errKasir, resKasir) => {
        const kasir_id = (resKasir && resKasir.length > 0) ? resKasir[0].id : 1; // Default ke admin utama jika tidak ketemu

        // 2. Simpan Nota Utama ke tabel 'pesanan'
        const sqlPesanan = `INSERT INTO pesanan (nomor_nota, pelanggan_id, kasir_id, metode_pembayaran, total_tagihan, uang_diterima, uang_kembalian) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlPesanan, [nomor_nota, pelanggan_id, kasir_id, metode_pembayaran, total_tagihan, uang_diterima, uang_kembalian], (err, result) => {
            if (err) {
                console.error("Error insert pesanan:", err);
                return res.status(500).json({ status: 'GAGAL', pesan: 'Gagal membuat nota pesanan ke MySQL.' });
            }

            const pesanan_id = result.insertId; // ID Nota yang baru saja terbuat

            // 3. Siapkan rincian belanja (Snapshots) untuk tabel 'detail_pesanan'
            const dataRincian = keranjang.map(item => [
                pesanan_id, 
                item.id_layanan,
                item.nama_layanan, 
                item.kategori,
                item.qty, 
                item.harga_satuan, 
                (item.qty * item.harga_satuan) // Subtotal per item
            ]);

            const sqlDetail = "INSERT INTO detail_pesanan (pesanan_id, layanan_id, nama_layanan_snapshot, kategori_snapshot, qty, harga_satuan_snapshot, subtotal) VALUES ?";

            // 4. Masukkan seluruh rincian sekaligus ke database
            db.query(sqlDetail, [dataRincian], (errDetail) => {
                if (errDetail) {
                    console.error("Error insert detail:", errDetail);
                    return res.status(500).json({ status: 'GAGAL', pesan: 'Gagal menyimpan detail keranjang.' });
                }

                // Berhasil 100%
                res.json({ 
                    status: 'SUKSES', 
                    pesan: 'Transaksi berhasil disimpan!', 
                    nomor_nota: nomor_nota 
                });
            });
        });
    });
});

// ==========================================
// API RIWAYAT PESANAN (LIST ORDER)
// ==========================================

// 1. Mengambil Daftar Pesanan (JOIN dengan tabel pelanggan)
app.get('/api/pesanan', (req, res) => {
    const sql = `
        SELECT p.id, p.nomor_nota, p.tanggal_order, p.status, p.total_tagihan, p.metode_pembayaran,
               c.name AS nama_pelanggan, c.phone AS no_hp
        FROM pesanan p
        JOIN pelanggan c ON p.pelanggan_id = c.id
        ORDER BY p.tanggal_order DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error ambil riwayat pesanan:", err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil riwayat pesanan' });
        }
        res.json({ status: 'SUKSES', data: results });
    });
});

// 2. Mengubah Status Pesanan menjadi "Selesai"
app.put('/api/pesanan/:id/status', (req, res) => {
    const { id } = req.params;
    
    const sql = "UPDATE pesanan SET status = 'Selesai' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error update status:", err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengubah status pesanan' });
        }
        res.json({ status: 'SUKSES', pesan: 'Status pesanan berhasil diperbarui!' });
    });
});

// ==========================================
// API STATISTIK (DASHBOARD)
// ==========================================
app.get('/api/dashboard', (req, res) => {
    // 4 Query SQL untuk mengambil rangkuman data
    const queryPendapatan = "SELECT SUM(total_tagihan) AS pendapatan FROM pesanan WHERE DATE(tanggal_order) = CURDATE()";
    const queryProses = "SELECT COUNT(id) AS proses FROM pesanan WHERE status = 'Proses'";
    const querySelesai = "SELECT COUNT(id) AS selesai FROM pesanan WHERE status = 'Selesai' AND DATE(tanggal_order) = CURDATE()";
    const queryPelanggan = "SELECT COUNT(id) AS pelanggan FROM pelanggan";

    // Mengeksekusi query secara berurutan
    db.query(queryPendapatan, (err, res1) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal hitung pendapatan' });
        
        db.query(queryProses, (err, res2) => {
            db.query(querySelesai, (err, res3) => {
                db.query(queryPelanggan, (err, res4) => {
                    
                    // Kirim semua hasilnya dalam satu paket JSON
                    res.json({
                        status: 'SUKSES',
                        data: {
                            pendapatan: res1[0].pendapatan || 0, // Jika null, jadikan 0
                            proses: res2[0].proses || 0,
                            selesai: res3[0].selesai || 0,
                            pelanggan: res4[0].pelanggan || 0
                        }
                    });
                    
                });
            });
        });
    });
});

// Ubah angka 3000 menjadi process.env.PORT || 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend Spincycle berjalan di port ${PORT}`);
});

// ==========================================
// API LAYANAN (MASTER DATA HARGA)
// ==========================================

// 1. Mengambil Daftar Layanan (Bisa diakses semua role)
app.get('/api/layanan', (req, res) => {
    // Diurutkan berdasarkan kategori (Kiloan dulu, baru Satuan)
    db.query("SELECT * FROM layanan ORDER BY category ASC, price ASC", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal mengambil data layanan' });
        }
        res.json({ status: 'SUKSES', data: results });
    });
});

// 2. Menambah Layanan Baru (Seharusnya hanya Admin)
app.post('/api/layanan', (req, res) => {
    const { service_name, category, price, unit, estimated_days } = req.body;

    if (!service_name || !price || !unit) {
        return res.status(400).json({ status: 'GAGAL', pesan: 'Nama, Harga, dan Unit wajib diisi!' });
    }

    const sql = "INSERT INTO layanan (service_name, category, price, unit, estimated_days) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [service_name, category, price, unit, estimated_days || 1], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menyimpan layanan baru' });
        }
        res.json({ status: 'SUKSES', pesan: 'Layanan baru berhasil ditambahkan!' });
    });
});

// 3. Menghapus Layanan
app.delete('/api/layanan/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM layanan WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'ERROR', pesan: 'Gagal menghapus layanan' });
        res.json({ status: 'SUKSES', pesan: 'Layanan berhasil dihapus dari sistem!' });
    });
});