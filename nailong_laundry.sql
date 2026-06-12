SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS role_access_control;
DROP TABLE IF EXISTS detail_pesanan;
DROP TABLE IF EXISTS pesanan;
DROP TABLE IF EXISTS pengeluaran;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS layanan;
DROP TABLE IF EXISTS pelanggan;
DROP TABLE IF EXISTS karyawan;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE karyawan (
  id INT NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  no_telepon VARCHAR(20) DEFAULT NULL,
  jabatan ENUM('Admin','Kasir','Karyawan','Kurir') NOT NULL DEFAULT 'Karyawan',
  hari_kerja VARCHAR(50) DEFAULT NULL,
  jam_masuk TIME DEFAULT NULL,
  jam_pulang TIME DEFAULT NULL,
  status_aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pelanggan (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  status_member VARCHAR(20) DEFAULT 'Non-Member',
  tgl_aktif_member DATE DEFAULT NULL,
  tgl_expired_member DATE DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE layanan (
  id INT NOT NULL AUTO_INCREMENT,
  service_name VARCHAR(100) NOT NULL,
  category ENUM('Kiloan','Satuan') NOT NULL,
  price INT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  estimated_days INT DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pesanan (
  id INT NOT NULL AUTO_INCREMENT,
  pelanggan_id INT NOT NULL,
  paket_id INT NOT NULL,
  layanan_id INT DEFAULT NULL,
  berat DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  metode_pengambilan VARCHAR(50) NOT NULL DEFAULT 'ambil_sendiri',
  jarak_km DECIMAL(8,2) DEFAULT 0.00,
  ongkir INT DEFAULT 0,
  total_harga INT NOT NULL,
  status_pesanan ENUM('Diproses','Selesai','Diambil') NOT NULL DEFAULT 'Diproses',
  status_pembayaran ENUM('Belum Lunas','Lunas') NOT NULL DEFAULT 'Belum Lunas',
  metode_pembayaran ENUM('Tunai','QRIS','Transfer') DEFAULT NULL,
  uang_diterima INT NOT NULL DEFAULT 0,
  uang_kembalian INT NOT NULL DEFAULT 0,
  kasir_id INT DEFAULT NULL,
  catatan TEXT DEFAULT NULL,
  tanggal_masuk TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY pelanggan_id (pelanggan_id),
  KEY layanan_id (layanan_id),
  KEY kasir_id (kasir_id),
  CONSTRAINT pesanan_pelanggan_fk FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id) ON DELETE CASCADE,
  CONSTRAINT pesanan_layanan_fk FOREIGN KEY (layanan_id) REFERENCES layanan (id) ON DELETE SET NULL,
  CONSTRAINT pesanan_kasir_fk FOREIGN KEY (kasir_id) REFERENCES karyawan (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE detail_pesanan (
  id INT NOT NULL AUTO_INCREMENT,
  pesanan_id INT NOT NULL,
  layanan_id INT NOT NULL,
  nama_layanan_snapshot VARCHAR(100) NOT NULL,
  kategori_snapshot VARCHAR(50) DEFAULT NULL,
  unit_snapshot VARCHAR(20) DEFAULT NULL,
  qty DECIMAL(8,2) NOT NULL,
  harga_satuan_snapshot INT NOT NULL,
  subtotal INT NOT NULL,
  PRIMARY KEY (id),
  KEY pesanan_id (pesanan_id),
  KEY layanan_id (layanan_id),
  CONSTRAINT detail_pesanan_pesanan_fk FOREIGN KEY (pesanan_id) REFERENCES pesanan (id) ON DELETE CASCADE,
  CONSTRAINT detail_pesanan_layanan_fk FOREIGN KEY (layanan_id) REFERENCES layanan (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE role_access_control (
  id INT NOT NULL AUTO_INCREMENT,
  role ENUM('Admin','Kasir','Karyawan','Kurir') NOT NULL,
  page_key VARCHAR(100) NOT NULL,
  page_name VARCHAR(100) NOT NULL,
  can_access TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY role_page_unique (role, page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE settings (
  id INT NOT NULL DEFAULT 1,
  nama_laundry VARCHAR(100) DEFAULT NULL,
  alamat VARCHAR(255) DEFAULT NULL,
  telepon VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pengeluaran (
  id INT NOT NULL AUTO_INCREMENT,
  keterangan VARCHAR(255) NOT NULL,
  nominal DECIMAL(12,2) NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO karyawan (nama, username, password, no_telepon, jabatan, hari_kerja, jam_masuk, jam_pulang, status_aktif) VALUES
('Admin Spincycle', 'admin', '$2b$10$OY6KmhPLvS66fQw0sxZTieji3xlBAUL23h.fGqVFqk23Ob/RfKD3e', '081234567890', 'Admin', 'Senin Minggu', '08:00:00', '20:00:00', 1);

INSERT INTO pelanggan (name, phone, address) VALUES
('Joko', '081111111111', 'Solo'),
('Linn', '082222222222', 'Bekasi');

INSERT INTO layanan (service_name, category, price, unit, estimated_days) VALUES
('Cuci Setrika', 'Kiloan', 6000, 'Kg', 2),
('Cuci Kering Lipat', 'Kiloan', 5000, 'Kg', 1),
('Selimut', 'Satuan', 7000, 'Pcs', 3),
('Sprei', 'Satuan', 7000, 'Pcs', 3),
('Tas', 'Satuan', 10000, 'Pcs', 4),
('Sepatu', 'Satuan', 25000, 'Pasang', 5);

INSERT INTO settings (id, nama_laundry, alamat, telepon, email) VALUES
(1, 'Spincycle Laundry', 'Jl. Margonda Raya, Depok', '08123456789', NULL);

INSERT INTO role_access_control (role, page_key, page_name, can_access) VALUES
('Admin','dashboard.html','Dashboard',1),
('Admin','transaksi_baru.html','Transaksi Baru',1),
('Admin','ringkasan_pesanan.html','Ringkasan Pesanan',1),
('Admin','list_order.html','Daftar Pesanan',1),
('Admin','pembayaran.html','Pembayaran',1),
('Admin','pelanggan_tambah.html','Pelanggan',1),
('Admin','layanan.html','Layanan',1),
('Admin','laporan.html','Laporan Keuangan',1),
('Admin','profile.html','Profil',1),
('Admin','karyawan.html','Manajemen Karyawan',1),
('Admin','access_control.html','Kontrol Akses',1),
('Kasir','dashboard.html','Dashboard',1),
('Kasir','transaksi_baru.html','Transaksi Baru',1),
('Kasir','ringkasan_pesanan.html','Ringkasan Pesanan',1),
('Kasir','list_order.html','Daftar Pesanan',1),
('Kasir','pembayaran.html','Pembayaran',1),
('Kasir','pelanggan_tambah.html','Pelanggan',1),
('Kasir','layanan.html','Layanan',1),
('Kasir','laporan.html','Laporan Keuangan',0),
('Kasir','profile.html','Profil',1),
('Kasir','karyawan.html','Manajemen Karyawan',0),
('Kasir','access_control.html','Kontrol Akses',0),
('Karyawan','dashboard.html','Dashboard',1),
('Karyawan','transaksi_baru.html','Transaksi Baru',1),
('Karyawan','ringkasan_pesanan.html','Ringkasan Pesanan',1),
('Karyawan','list_order.html','Daftar Pesanan',1),
('Karyawan','pembayaran.html','Pembayaran',0),
('Karyawan','pelanggan_tambah.html','Pelanggan',1),
('Karyawan','layanan.html','Layanan',1),
('Karyawan','laporan.html','Laporan Keuangan',0),
('Karyawan','profile.html','Profil',1),
('Karyawan','karyawan.html','Manajemen Karyawan',0),
('Karyawan','access_control.html','Kontrol Akses',0),
('Kurir','dashboard.html','Dashboard',1),
('Kurir','transaksi_baru.html','Transaksi Baru',0),
('Kurir','ringkasan_pesanan.html','Ringkasan Pesanan',0),
('Kurir','list_order.html','Daftar Pesanan',1),
('Kurir','pembayaran.html','Pembayaran',0),
('Kurir','pelanggan_tambah.html','Pelanggan',0),
('Kurir','layanan.html','Layanan',0),
('Kurir','laporan.html','Laporan Keuangan',0),
('Kurir','profile.html','Profil',1),
('Kurir','karyawan.html','Manajemen Karyawan',0),
('Kurir','access_control.html','Kontrol Akses',0);
