const db = require('../config/db');

// A. Membuat Pesanan Baru (Terintegrasi Membership)
exports.buatPesanan = (req, res) => {
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km } = req.body;
    
    // Ambil data pelanggan untuk cek status member
    const sqlCek = `SELECT status_member, tgl_expired_member FROM pelanggan WHERE id = ?`;
    db.query(sqlCek, [pelanggan_id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Pelanggan tidak ditemukan" });

        const member = results[0];
        const sekarang = new Date();
        const tglExpired = new Date(member.tgl_expired_member);
        const isMemberAktif = (member.status_member === 'Member' && tglExpired > sekarang);

        // Harga Paket
        const hargaPaket = { 1: 5000, 2: 7000, 3: 10000 };
        const totalHarga = (hargaPaket[paket_id] * berat) + ((metode_pengambilan === 'antar' && !isMemberAktif) ? (jarak_km * 1000) : 0);

        const sqlInsert = `INSERT INTO pesanan (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga, status_pembayaran) VALUES (?, ?, ?, ?, ?, ?, ?, 'Belum Lunas')`;
        
        db.query(sqlInsert, [pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, (isMemberAktif ? 0 : jarak_km * 1000), totalHarga], (err2, result) => {
            if (err2) return res.status(500).json({ error: "Gagal menyimpan pesanan" });
            res.status(201).json({ nota_id: result.insertId });
        });
    });
};

// B. Mengambil List Pesanan dengan Filter (Admin/Kasir)
exports.getListPesanan = (req, res) => {
    const { status_pesanan, status_pembayaran } = req.query;
    let sql = `SELECT p.*, c.name as nama_pelanggan FROM pesanan p JOIN pelanggan c ON p.pelanggan_id = c.id WHERE 1=1`;
    const params = [];

    if (status_pesanan) { sql += " AND status_pesanan = ?"; params.push(status_pesanan); }
    if (status_pembayaran) { sql += " AND status_pembayaran = ?"; params.push(status_pembayaran); }

    db.query(sql + " ORDER BY tanggal_masuk DESC", params, (err, results) => {
        if (err) return res.status(500).json({ error: "Gagal ambil data" });
        res.json(results);
    });
};

// C. Update Status Pembayaran/Pesanan
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status_pesanan, status_pembayaran } = req.body;
    
    db.query("UPDATE pesanan SET status_pesanan = ?, status_pembayaran = ? WHERE id = ?", 
             [status_pesanan, status_pembayaran, id], (err) => {
        if (err) return res.status(500).json({ error: "Gagal update" });
        res.json({ message: "Status diperbarui" });
    });
};