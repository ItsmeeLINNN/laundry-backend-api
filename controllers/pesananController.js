const db = require('../config/db');

exports.buatPesanan = (req, res) => {
    // 1. Tangkap data dari Vercel
    const { pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km } = req.body;

    // 2. Tentukan Harga Paket
    let hargaPerKg = 0;
    let namaPaket = '';
    if (paket_id == '1') { hargaPerKg = 5000; namaPaket = 'Hemat 3 Hari'; }
    else if (paket_id == '2') { hargaPerKg = 7000; namaPaket = 'Reguler 1 Hari'; }
    else if (paket_id == '3') { hargaPerKg = 10000; namaPaket = 'Express 6 Jam'; }
    else return res.status(400).json({ error: "Paket tidak valid" });

    const hargaCucian = hargaPerKg * berat;

    // 3. Cek apakah Pelanggan ini "Member" untuk urusan diskon Ongkir
    // Kita panggil data pelanggan dari database
    const sqlPelanggan = `SELECT * FROM pelanggan WHERE id = ?`;
    
    db.query(sqlPelanggan, [pelanggan_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error saat ngecek pelanggan" });
        if (results.length === 0) return res.status(404).json({ error: "Pelanggan tidak ditemukan" });

        const pelanggan = results[0];
        // Cek kolom member (sesuaikan jika nama kolommu di database berbeda, misal: 'is_member' atau 'status_member')
        const isMember = pelanggan.is_member || pelanggan.member || 0; 
        
        // 4. Hitung Ongkir
        let ongkir = 0;
        if (metode_pengambilan === 'antar') {
            // Jika BUKAN member, kena tarif Rp1.000/km
            if (!isMember) {
                ongkir = jarak_km * 1000;
            }
        }

        const totalBayar = hargaCucian + ongkir;

        // 5. Simpan Pesanan ke Tabel Database
        // Pastikan nama kolom ini sesuai dengan struktur tabel 'pesanan' di phpMyAdmin/Railway kamu
        const sqlInsert = `INSERT INTO pesanan (pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga, status_pesanan) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, 'Diproses')`;
        
        db.query(sqlInsert, [pelanggan_id, paket_id, berat, metode_pengambilan, jarak_km, ongkir, totalBayar], (err2, resultInsert) => {
            if (err2) {
                console.error("Error Insert:", err2);
                return res.status(500).json({ error: "Gagal menyimpan ke database. Cek struktur tabelmu!" });
            }

            // 6. Jika sukses, kembalikan struk digital ke Frontend
            res.status(201).json({
                message: "Pesanan berhasil dibuat",
                nota_id: resultInsert.insertId,
                rincian: {
                    paket: namaPaket,
                    harga_cucian: hargaCucian,
                    ongkir: ongkir,
                    total: totalBayar
                }
            });
        });
    });
};