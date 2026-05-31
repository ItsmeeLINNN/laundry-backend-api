const db = require('../config/db');

exports.buatPesanan = (req, res) => {
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km } = req.body;

    // 1. Definisikan Paket Layanan
    const paketData = {
        1: { nama: 'Hemat 3 Hari', harga: 5000 },
        2: { nama: 'Reguler 1 Hari', harga: 7000 },
        3: { nama: 'Express 6 Jam', harga: 10000 }
    };

    const paket = paketData[paket_id];
    if (!paket) return res.status(400).json({ error: "Paket tidak valid" });

    // 2. Cek Status Membership Pelanggan
    const sqlCekMember = `SELECT status_member, tgl_expired_member FROM pelanggan WHERE id = ?`;
    
    db.query(sqlCekMember, [pelanggan_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: "Pelanggan tidak ditemukan" });

        const pelanggan = results[0];
        const sekarang = new Date();
        const tglExpired = new Date(pelanggan.tgl_expired_member);

        // Validasi: Apakah member aktif?
        const isMemberAktif = (pelanggan.status_member === 'Member' && tglExpired > sekarang);

        // 3. Kalkulasi Harga
        const hargaCucian = paket.harga * berat;
        const ongkir = (metode_pengambilan === 'antar' && !isMemberAktif) ? (jarak_km * 1000) : 0;
        const totalBayar = hargaCucian + ongkir;

        // 4. Simpan ke Database
        const sqlInsert = `INSERT INTO pesanan (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sqlInsert, [pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, totalBayar], (err2, result) => {
            if (err2) return res.status(500).json({ error: "Gagal menyimpan ke database." });

            res.status(201).json({
                message: "Pesanan berhasil dibuat",
                nota_id: result.insertId,
                rincian: {
                    paket: paket.nama,
                    total: totalBayar,
                    ongkir: ongkir
                }
            });
        });
    });
};