const db = require('../config/db');

// A. Membuat Pesanan Baru (Menyimpan layanan_id dari Frontend)
exports.buatPesanan = (req, res) => {
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, total_harga, layanan_id } = req.body;
    
    // Validasi data input utama wajib
    if (!pelanggan_id || !paket_id || !total_harga || !layanan_id) {
        return res.status(400).json({ error: "Data pelanggan, paket, total harga, atau layanan_id wajib dikirim!" });
    }

    // Query insert menyertakan kolom layanan_id
    const sqlInsert = `INSERT INTO pesanan 
        (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga, status_pesanan, status_pembayaran, layanan_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Diproses', 'Belum Lunas', ?)`;
    
    const ongkir = 0;
    const jarak = jarak_km || 0;
    const kuantitasCucian = berat || 1; 

    db.query(sqlInsert, [pelanggan_id, paket_id, kuantitasCucian, metode_pengambilan, jarak, ongkir, total_harga, layanan_id], (err, result) => {
        if (err) {
            console.error("Error simpan pesanan:", err);
            return res.status(500).json({ error: "Gagal menyimpan data transaksi baru" });
        }
        res.status(201).json({ status: 'SUKSES', nota_id: result.insertId });
    });
};

// B. Mengambil List Pesanan dengan Filter (LEFT JOIN dengan tabel layanan secara Real-time)
exports.getListPesanan = (req, res) => {
    const { status_pesanan, status_pembayaran } = req.query;
    
    // Mengambil service_name, category, dan unit langsung dari tabel layanan
    let sql = `SELECT p.*, c.name as nama_pelanggan, c.phone as no_hp,
                      l.service_name, l.category, l.unit
               FROM pesanan p 
               JOIN pelanggan c ON p.pelanggan_id = c.id 
               LEFT JOIN layanan l ON p.layanan_id = l.id
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