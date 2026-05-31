const db = require('./config/db');

const jalankanMigrasi = async () => {
    console.log("🚀 Memulai proses migrasi database...");

    try {
        // 1. Matikan Foreign Key
        await queryPromise("SET FOREIGN_KEY_CHECKS = 0");
        console.log("🔒 Foreign Key checks disabled.");

        // 2. Hapus tabel (satu per satu untuk menghindari error)
        await queryPromise("DROP TABLE IF EXISTS detail_pesanan");
        await queryPromise("DROP TABLE IF EXISTS pesanan");
        await queryPromise("DROP TABLE IF EXISTS pelanggan");
        await queryPromise("DROP TABLE IF EXISTS settings");
        console.log("✅ Tabel-tabel lama berhasil dihapus.");

        // 3. Buat tabel baru
        await queryPromise(`CREATE TABLE pelanggan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            address VARCHAR(255),
            status_member VARCHAR(20) DEFAULT 'Non-Member',
            tgl_aktif_member DATE NULL,
            tgl_expired_member DATE NULL
        )`);

        await queryPromise(`CREATE TABLE pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pelanggan_id INT NOT NULL,
            paket_id INT NOT NULL,
            berat DECIMAL(5,2) NOT NULL,
            metode_pengambilan VARCHAR(50) NOT NULL,
            jarak_km DECIMAL(5,2) DEFAULT 0,
            ongkir INT DEFAULT 0,
            total_harga INT NOT NULL,
            status_pesanan VARCHAR(50) DEFAULT 'Diproses',
            tanggal_masuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id)
        )`);

        await queryPromise(`CREATE TABLE settings (
            id INT PRIMARY KEY DEFAULT 1,
            nama_laundry VARCHAR(100),
            alamat VARCHAR(255),
            telepon VARCHAR(20),
            email VARCHAR(100)
        )`);

        // Tambahkan perintah ini ke setup_db.js untuk update tabel pesanan
        await queryPromise(`ALTER TABLE pesanan ADD COLUMN status_pembayaran VARCHAR(20) DEFAULT 'Belum Lunas'`);

        await queryPromise("INSERT INTO settings (id, nama_laundry, alamat, telepon) VALUES (1, 'Spincycle Laundry', 'Jl. Margonda Raya, Depok', '08123456789')");
        console.log("✅ Tabel baru berhasil dibuat.");

        // 4. Nyalakan kembali Foreign Key
        await queryPromise("SET FOREIGN_KEY_CHECKS = 1");
        console.log("🎉 Migrasi database SELESAI!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error migrasi:", err);
        process.exit(1);
    }
};

// Helper untuk mengubah db.query menjadi promise
function queryPromise(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

jalankanMigrasi();