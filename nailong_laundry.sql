-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 22 Bulan Mei 2026 pada 12.34
-- Versi server: 8.4.3
-- Versi PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Basis data: `nailong_laundry`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `detail_pesanan`
--

CREATE TABLE `detail_pesanan` (
  `id` int NOT NULL,
  `pesanan_id` int NOT NULL,
  `layanan_id` int NOT NULL,
  `nama_layanan_snapshot` varchar(100) NOT NULL,
  `kategori_snapshot` varchar(50) DEFAULT NULL,
  `qty` decimal(5,2) NOT NULL,
  `harga_satuan_snapshot` int NOT NULL,
  `subtotal` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `detail_pesanan`
--

INSERT INTO `detail_pesanan` (`id`, `pesanan_id`, `layanan_id`, `nama_layanan_snapshot`, `kategori_snapshot`, `qty`, `harga_satuan_snapshot`, `subtotal`) VALUES
(5, 2, 2, 'Cuci Kering + Lipat', 'Kiloan', 2.00, 5000, 10000),
(6, 2, 3, 'Selimut', 'Satuan', 1.00, 7000, 7000),
(7, 2, 4, 'Sprei', 'Satuan', 1.00, 7000, 7000),
(8, 3, 1, 'Cuci Setrika', 'Kiloan', 3.00, 6000, 18000),
(9, 4, 2, 'Cuci Kering + Lipat', 'Kiloan', 2.00, 5000, 10000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `layanan`
--

CREATE TABLE `layanan` (
  `id` int NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `category` enum('Kiloan','Satuan') NOT NULL,
  `price` int NOT NULL,
  `unit` varchar(20) NOT NULL,
  `estimated_days` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `layanan`
--

INSERT INTO `layanan` (`id`, `service_name`, `category`, `price`, `unit`, `estimated_days`) VALUES
(1, 'Cuci Setrika', 'Kiloan', 6000, 'Kg', 2),
(2, 'Cuci Kering + Lipat', 'Kiloan', 5000, 'Kg', 1),
(3, 'Selimut', 'Satuan', 7000, 'Pcs', 3),
(4, 'Sprei', 'Satuan', 7000, 'Pcs', 3),
(5, 'Tas', 'Satuan', 10000, 'Pcs', 4),
(6, 'Sepatu', 'Satuan', 25000, 'Pasang', 5),
(8, 'Cuci Mobil', 'Satuan', 80000, 'Pcs', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `pelanggan`
--

INSERT INTO `pelanggan` (`id`, `name`, `phone`, `email`, `address`, `created_at`) VALUES
(3, 'LINNn', '2222', NULL, 'Bekasi', '2026-05-18 02:46:53'),
(4, 'Joko', '1122', NULL, 'Solo', '2026-05-18 03:02:29');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pesanan`
--

CREATE TABLE `pesanan` (
  `id` int NOT NULL,
  `nomor_nota` varchar(20) NOT NULL,
  `pelanggan_id` int NOT NULL,
  `kasir_id` int NOT NULL,
  `tanggal_order` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estimasi_selesai` date DEFAULT NULL,
  `status` enum('Proses','Selesai') DEFAULT 'Proses',
  `metode_pembayaran` enum('Tunai','QRIS','Transfer') NOT NULL,
  `total_tagihan` int NOT NULL,
  `uang_diterima` int NOT NULL,
  `uang_kembalian` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `pesanan`
--

INSERT INTO `pesanan` (`id`, `nomor_nota`, `pelanggan_id`, `kasir_id`, `tanggal_order`, `estimasi_selesai`, `status`, `metode_pembayaran`, `total_tagihan`, `uang_diterima`, `uang_kembalian`) VALUES
(2, 'ORD-1779073295', 3, 1, '2026-05-18 03:01:35', NULL, 'Selesai', 'Tunai', 24000, 24000, 0),
(3, 'ORD-1779073379', 4, 1, '2026-05-18 03:02:59', NULL, 'Selesai', 'Tunai', 18000, 18000, 0),
(4, 'ORD-1779195814', 4, 1, '2026-05-19 13:03:34', NULL, 'Proses', 'Tunai', 10000, 100000, 90000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('Admin','Karyawan') DEFAULT 'Admin',
  `is_active` enum('true','false') DEFAULT 'true',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `phone`, `role`, `is_active`, `created_at`) VALUES
(1, 'andrakubaik', '123456', 'Andra Kubaik Achmad', '+62 812-3456-7890', 'Admin', 'true', '2026-05-17 17:07:00');

--
-- Indeks untuk tabel yang dibuang
--

--
-- Indeks untuk tabel `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pesanan_id` (`pesanan_id`),
  ADD KEY `layanan_id` (`layanan_id`);

--
-- Indeks untuk tabel `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indeks untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nomor_nota` (`nomor_nota`),
  ADD KEY `pelanggan_id` (`pelanggan_id`),
  ADD KEY `kasir_id` (`kasir_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD CONSTRAINT `detail_pesanan_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_pesanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pesanan_ibfk_2` FOREIGN KEY (`kasir_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
