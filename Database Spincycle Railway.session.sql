-- 1. TABEL PENGATURAN (Settings)
CREATE TABLE pengaturan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_laundry VARCHAR(100) DEFAULT 'Spincycle Laundry',
    alamat TEXT,
    no_telepon VARCHAR(20),
    email VARCHAR(100),
    versi_aplikasi VARCHAR(10) DEFAULT '2.0.0'
);

-- 2. TABEL KARYAWAN (Users)
CREATE TABLE karyawan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    no_telepon VARCHAR(20),
    alamat TEXT,
    jabatan ENUM('Admin', 'Kasir', 'Kurir') DEFAULT 'Kasir',
    hari_kerja VARCHAR(50), 
    jam_masuk TIME,
    jam_pulang TIME,
    status_aktif BOOLEAN DEFAULT TRUE
);

-- 3. TABEL PAKET LAYANAN
CREATE TABLE paket_layanan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_paket VARCHAR(50) NOT NULL,
    durasi_jam INT NOT NULL,
    harga_per_kg DECIMAL(10,2) NOT NULL
);

-- 4. INSERT DATA PAKET DEFAULT
INSERT INTO paket_layanan (nama_paket, durasi_jam, harga_per_kg) VALUES 
('Hemat 3 Hari', 72, 5000),
('Reguler 1 Hari', 24, 7000),
('Express 6 Jam', 6, 10000);

-- 5. UPDATE TABEL PELANGGAN (Membership)
ALTER TABLE pelanggan 
ADD COLUMN is_member BOOLEAN DEFAULT FALSE,
ADD COLUMN tgl_daftar_member DATE NULL,
ADD COLUMN masa_aktif_member DATE NULL;

-- 6. UPDATE TABEL PESANAN
ALTER TABLE pesanan 
ADD COLUMN paket_id INT,
ADD COLUMN metode_pengambilan ENUM('ambil_sendiri', 'antar') DEFAULT 'ambil_sendiri',
ADD COLUMN jarak_km DECIMAL(5,2) DEFAULT 0,
ADD COLUMN ongkir DECIMAL(10,2) DEFAULT 0,
ADD COLUMN is_lunas BOOLEAN DEFAULT FALSE,
ADD COLUMN is_selesai BOOLEAN DEFAULT FALSE,
ADD FOREIGN KEY (paket_id) REFERENCES paket_layanan(id);

