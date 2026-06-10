const db = require('../config/db');

// A. Membuat Pesanan Baru (Sistem Membership Dihapus, Terima Harga Final dari Frontend)
exports.buatPesanan = (req, res) => {
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, total_harga } = req.body;
    
    // Validasi data input utama wajib
    if (!pelanggan_id || !paket_id || !total_harga) {
        return res.status(400).json({ error: "Data pelanggan, paket, atau total harga wajib dikirim!" });
    }

    // Query insert disesuaikan dengan skema setup_db.js terbaru
    const sqlInsert = `INSERT INTO pesanan 
        (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga, status_pesanan, status_pembayaran) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Diproses', 'Belum Lunas')`;
    
    // Default nilai karena pengantaran dan ongkir sudah ditiadakan
    const ongkir = 0;
    const jarak = jarak_km || 0;
    const beratTotal = berat || 1; // Proteksi fallback jika berat bernilai 0 agar DB tidak error

    db.query(sqlInsert, [pelanggan_id, paket_id, beratTotal, metode_pengambilan, jarak, ongkir, total_harga], (err, result) => {
        if (err) {
            console.error("Error simpan pesanan:", err);
            return res.status(500).json({ error: "Gagal menyimpan data transaksi baru" });
        }
        // Mengembalikan nota_id agar sesuai dengan pembacaan hasil di ringkasan_pesanan.html
        res.status(201).json({ status: 'SUKSES', nota_id: result.insertId });
    });
};

// B. Mengambil List Pesanan dengan Filter (Perbaikan Query Menampilkan Nomor HP Pelanggan)
exports.getListPesanan = (req, res) => {
    const { status_pesanan, status_pembayaran } = req.query;
    
    // PERBAIKAN: Menambahkan c.phone as no_hp agar nomor HP langsung ditarik dari database pelanggan
    let sql = `SELECT p.*, c.name as nama_pelanggan, c.phone as no_hp 
               FROM pesanan p 
               JOIN pelanggan c ON p.pelanggan_id = c.id 
               WHERE 1=1`;
    const params = [];

    if (status_pesanan) { sql += " AND p.status_pesanan = ?"; params.push(status_pesanan); }
    if (status_pembayaran) { sql += " AND p.status_pembayaran = ?"; params.push(status_pembayaran); }

    db.query(sql + " ORDER BY p.tanggal_masuk DESC, p.id DESC", params, (err, results) => {
        if (err) {
            console.error("Error ambil list pesanan:", err);
            return res.status(500).json({ error: "Gagal mengambil data pesanan" });
        }
        res.json(results);
    });
};

// C. Update Status Pembayaran / Status Cucian Pesanan
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status_pesanan, status_pembayaran } = req.body;
    
    db.query("UPDATE pesanan SET status_pesanan = ?, status_pembayaran = ? WHERE id = ?", 
             [status_pesanan, status_pembayaran, id], (err) => {
        if (err) {
            console.error("Error update status:", err);
            return res.status(500).json({ error: "Gagal memperbarui status transaksi" });
        }
        res.json({ status: 'SUKSES', message: "Status berhasil diperbarui" });
    });
};