ALTER TABLE karyawan
  MODIFY jabatan ENUM('Admin','Kasir','Karyawan','Kurir') NOT NULL DEFAULT 'Karyawan';

ALTER TABLE pesanan
  ADD COLUMN IF NOT EXISTS metode_pembayaran ENUM('Tunai','QRIS','Transfer') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS uang_diterima INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uang_kembalian INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kasir_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS catatan TEXT DEFAULT NULL;

ALTER TABLE detail_pesanan
  ADD COLUMN IF NOT EXISTS unit_snapshot VARCHAR(20) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS role_access_control (
  id INT NOT NULL AUTO_INCREMENT,
  role ENUM('Admin','Kasir','Karyawan','Kurir') NOT NULL,
  page_key VARCHAR(100) NOT NULL,
  page_name VARCHAR(100) NOT NULL,
  can_access TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY role_page_unique (role, page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
('Kurir','access_control.html','Kontrol Akses',0)
ON DUPLICATE KEY UPDATE page_name = VALUES(page_name), can_access = VALUES(can_access);
