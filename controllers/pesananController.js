const db = require('../config/db');

// Buat Pesanan Baru (Otomatis hitung ongkir, paket, dan member)
exports.buatPesanan = (req, res) => {
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km } = req.body;

    // 1. Ambil harga paket & status membership pelanggan
    const sqlCheck = `SELECT p.is_member, p.masa_aktif_member, pk.harga_per_kg, pk.nama_paket 
                      FROM pelanggan p JOIN paket_layanan pk ON pk.id = ? WHERE p.id = ?`;
    
    db.query(sqlCheck, [paket_id, pelanggan_id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Data tidak valid" });
        
        const data = results[0];
        let total_cucian = data.harga_per_kg * berat;
        let ongkir = 0;

        // 2. Hitung Ongkir (Rp1.000 / km)
        if (metode_pengambilan === 'antar') {
            ongkir = jarak_km * 1000;
        }

        // 3. Cek Membership (Gratis Ongkir)
        const today = new Date();
        const batasMember = new Date(data.masa_aktif_member);
        if (data.is_member && batasMember >= today) {
            ongkir = 0; // Benefit gratis ongkir
        }

        const total_bayar = total_cucian + ongkir;

        // 4. Simpan ke Database
        const sqlInsert = `INSERT INTO pesanan (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_bayar) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlInsert, [pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_bayar], (err, insertResult) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: "Pesanan berhasil dibuat!", 
                nota_id: insertResult.insertId,
                rincian: { paket: data.nama_paket, berat: berat, ongkir: ongkir, total: total_bayar }
            });
        });
    });
};

// Update Status Pesanan (Lunas / Selesai)
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { jenis_status, nilai } = req.body; // jenis_status: 'lunas' atau 'selesai', nilai: true/false
    
    let kolom = jenis_status === 'lunas' ? 'is_lunas' : 'is_selesai';
    const sql = `UPDATE pesanan SET ${kolom} = ? WHERE id = ?`;
    
    db.query(sql, [nilai, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Status ${jenis_status} berhasil diperbarui!` });
    });
};