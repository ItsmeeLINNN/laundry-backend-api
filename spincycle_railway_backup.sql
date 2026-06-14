-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: kodama.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `detail_pesanan`
--

DROP TABLE IF EXISTS `detail_pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detail_pesanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pesanan_id` int NOT NULL,
  `layanan_id` int NOT NULL,
  `nama_layanan_snapshot` varchar(100) NOT NULL,
  `kategori_snapshot` varchar(50) DEFAULT NULL,
  `unit_snapshot` varchar(20) DEFAULT NULL,
  `qty` decimal(8,2) NOT NULL,
  `harga_satuan_snapshot` int NOT NULL,
  `subtotal` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `detail_pesanan_pesanan_idx` (`pesanan_id`),
  KEY `detail_pesanan_layanan_idx` (`layanan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_pesanan`
--

LOCK TABLES `detail_pesanan` WRITE;
/*!40000 ALTER TABLE `detail_pesanan` DISABLE KEYS */;
INSERT INTO `detail_pesanan` VALUES (1,11,1,'Cuci Setrika','Kiloan','Kg',2.00,6000,12000),(2,12,1,'Cuci Setrika','Kiloan','Kg',2.00,6000,12000);
/*!40000 ALTER TABLE `detail_pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `karyawan`
--

DROP TABLE IF EXISTS `karyawan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `karyawan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `no_telepon` varchar(20) DEFAULT NULL,
  `alamat` text,
  `jabatan` enum('Admin','Kasir','Karyawan') NOT NULL DEFAULT 'Karyawan',
  `hari_kerja` varchar(100) DEFAULT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_pulang` time DEFAULT NULL,
  `status_aktif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `karyawan_username_unique` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `karyawan`
--

LOCK TABLES `karyawan` WRITE;
/*!40000 ALTER TABLE `karyawan` DISABLE KEYS */;
INSERT INTO `karyawan` VALUES (3,'Ikfina Kamalia Rahmah','pinpin','$2b$10$csrHyPUTq7zdW7M9jA4fY.N.ftrj7qzxjPZfgVNAvd7vZcfPw6i4y',NULL,NULL,'Kasir',NULL,'07:00:00','20:00:00',1,'2026-06-12 16:25:52',NULL),(7,'Fadhlin Nauri Mahrijar','LINNn','$2b$10$c96Fa4bTbIB1TetadXjXXOtRqTIXQ4z1QoTTJ7xg45MRwhEGv/4vC',NULL,NULL,'Admin',NULL,NULL,NULL,1,'2026-06-12 16:25:52',NULL),(9,'Najwa Mahira',NULL,NULL,NULL,NULL,'Karyawan',NULL,'07:00:00','20:00:00',1,'2026-06-12 16:25:52','2026-06-12 16:32:51'),(10,'Michelle Adella Vega',NULL,NULL,NULL,NULL,'Karyawan',NULL,'07:00:00','20:00:00',1,'2026-06-12 16:25:52','2026-06-12 16:32:51'),(11,'Nabila Zain',NULL,NULL,NULL,NULL,'Karyawan',NULL,'07:00:00','20:00:00',1,'2026-06-12 16:25:52','2026-06-12 16:32:51');
/*!40000 ALTER TABLE `karyawan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `layanan`
--

DROP TABLE IF EXISTS `layanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `layanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_name` varchar(100) NOT NULL,
  `category` enum('Kiloan','Satuan') NOT NULL,
  `price` int NOT NULL,
  `unit` varchar(20) NOT NULL,
  `estimated_days` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `layanan`
--

LOCK TABLES `layanan` WRITE;
/*!40000 ALTER TABLE `layanan` DISABLE KEYS */;
INSERT INTO `layanan` VALUES (1,'Cuci Setrika','Kiloan',6000,'Kg',2),(2,'Cuci Kering + Lipat','Kiloan',5000,'Kg',1),(3,'Selimut','Satuan',7000,'Pcs',3),(4,'Sprei','Satuan',7000,'Pcs',3),(5,'Tas','Satuan',10000,'Pcs',4),(6,'Sepatu','Satuan',25000,'Pasang',5),(8,'Cuci Mobil','Satuan',80000,'Pcs',1),(10,'karpet','Satuan',50000,'pcs',1),(12,'Cuci Muka','Satuan',10000,'Pcs',1);
/*!40000 ALTER TABLE `layanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paket_layanan`
--

DROP TABLE IF EXISTS `paket_layanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paket_layanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_paket` varchar(50) NOT NULL,
  `durasi_jam` int NOT NULL DEFAULT '24',
  `harga_per_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estimasi_jam` int NOT NULL DEFAULT '24',
  `multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `status_aktif` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paket_layanan`
--

LOCK TABLES `paket_layanan` WRITE;
/*!40000 ALTER TABLE `paket_layanan` DISABLE KEYS */;
INSERT INTO `paket_layanan` VALUES (1,'Hemat 3 Hari',72,5000.00,24,1.00,1),(2,'Reguler 1 Hari',24,7000.00,24,1.00,1),(3,'Express 6 Jam',6,10000.00,24,1.00,1),(4,'Hemat',24,0.00,72,1.00,1),(5,'Reguler',24,0.00,24,1.20,1),(6,'Express',24,0.00,6,2.00,1);
/*!40000 ALTER TABLE `paket_layanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pelanggan`
--

DROP TABLE IF EXISTS `pelanggan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pelanggan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status_member` varchar(20) DEFAULT 'Non-Member',
  `tgl_aktif_member` date DEFAULT NULL,
  `tgl_expired_member` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pelanggan`
--

LOCK TABLES `pelanggan` WRITE;
/*!40000 ALTER TABLE `pelanggan` DISABLE KEYS */;
INSERT INTO `pelanggan` VALUES (1,'Sarul','0895357411433','Purbalingga','Non-Member',NULL,NULL,NULL),(2,'Hamid','081327512703','Solo','Non-Member',NULL,NULL,NULL),(3,'Ayuu','089516767210','Depok','Non-Member',NULL,NULL,NULL),(4,'Marcel','081210997806','Beekasi','Non-Member',NULL,NULL,NULL);
/*!40000 ALTER TABLE `pelanggan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pengeluaran`
--

DROP TABLE IF EXISTS `pengeluaran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pengeluaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keterangan` varchar(255) NOT NULL,
  `nominal` decimal(10,2) NOT NULL,
  `tanggal` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pengeluaran`
--

LOCK TABLES `pengeluaran` WRITE;
/*!40000 ALTER TABLE `pengeluaran` DISABLE KEYS */;
INSERT INTO `pengeluaran` VALUES (1,'Beli MBG',100000.00,'2026-06-10','2026-06-10 16:45:53'),(2,'Beli seblak',10000.00,'2026-06-12','2026-06-12 18:50:51');
/*!40000 ALTER TABLE `pengeluaran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pesanan`
--

DROP TABLE IF EXISTS `pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pesanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pelanggan_id` int NOT NULL,
  `paket_id` int NOT NULL,
  `layanan_id` int DEFAULT NULL,
  `berat` decimal(5,2) NOT NULL,
  `metode_pengambilan` varchar(50) NOT NULL,
  `jarak_km` decimal(5,2) DEFAULT '0.00',
  `ongkir` int DEFAULT '0',
  `total_harga` int NOT NULL,
  `status_pesanan` varchar(50) DEFAULT 'Diproses',
  `tanggal_masuk` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status_pembayaran` varchar(20) DEFAULT 'Belum Lunas',
  `metode_pembayaran` enum('Tunai','QRIS','Transfer') DEFAULT NULL,
  `uang_diterima` int NOT NULL DEFAULT '0',
  `uang_kembalian` int NOT NULL DEFAULT '0',
  `kasir_id` int DEFAULT NULL,
  `catatan` text,
  PRIMARY KEY (`id`),
  KEY `pelanggan_id` (`pelanggan_id`),
  CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pesanan`
--

LOCK TABLES `pesanan` WRITE;
/*!40000 ALTER TABLE `pesanan` DISABLE KEYS */;
INSERT INTO `pesanan` VALUES (1,1,1,1,3.00,'ambil_sendiri',0.00,0,18000,'Diambil','2026-06-10 15:58:01','Lunas',NULL,0,0,NULL,NULL),(2,1,3,2,0.50,'ambil_sendiri',0.00,0,19000,'Diambil','2026-06-10 15:59:45','Lunas',NULL,0,0,NULL,NULL),(3,2,3,1,2.00,'ambil_sendiri',0.00,0,24000,'Diambil','2026-06-10 16:42:50','Lunas',NULL,0,0,NULL,NULL),(4,2,3,8,1.00,'ambil_sendiri',0.00,0,160000,'Diambil','2026-06-10 16:44:29','Lunas',NULL,0,0,NULL,NULL),(5,2,1,3,1.00,'ambil_sendiri',0.00,0,39000,'Diambil','2026-06-10 18:30:05','Lunas',NULL,0,0,NULL,NULL),(6,1,3,5,1.00,'ambil_sendiri',0.00,0,20000,'Selesai','2026-06-10 18:32:07','Belum Lunas',NULL,0,0,NULL,NULL),(7,1,2,6,1.00,'ambil_sendiri',0.00,0,90000,'Selesai','2026-06-10 18:33:35','Belum Lunas',NULL,0,0,NULL,NULL),(8,1,3,2,2.00,'ambil_sendiri',0.00,0,20000,'Diproses','2026-06-10 18:44:35','Lunas',NULL,0,0,NULL,NULL),(9,3,1,1,2.00,'ambil_sendiri',0.00,0,12000,'Diambil','2026-06-10 18:47:48','Lunas',NULL,0,0,NULL,NULL),(10,1,2,2,1.00,'ambil_sendiri',0.00,0,6000,'Diambil','2026-06-11 00:17:56','Lunas','Tunai',10000,4000,NULL,NULL),(11,4,3,1,2.00,'ambil_sendiri',0.00,0,24000,'Diambil','2026-06-12 18:06:32','Lunas','Tunai',50000,26000,7,'Tidak ada catatan'),(12,3,2,1,2.00,'ambil_sendiri',0.00,0,14400,'Diproses','2026-06-12 18:45:11','Belum Lunas',NULL,0,0,7,'Tidak ada catatan');
/*!40000 ALTER TABLE `pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_access_control`
--

DROP TABLE IF EXISTS `role_access_control`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_access_control` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('Admin','Kasir','Karyawan') NOT NULL,
  `feature_key` varchar(50) NOT NULL,
  `feature_name` varchar(100) NOT NULL,
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_read` tinyint(1) NOT NULL DEFAULT '0',
  `can_update` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_feature_unique` (`role`,`feature_key`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_access_control`
--

LOCK TABLES `role_access_control` WRITE;
/*!40000 ALTER TABLE `role_access_control` DISABLE KEYS */;
INSERT INTO `role_access_control` VALUES (1,'Admin','dashboard','Dashboard',1,1,1,1,'2026-06-12 16:38:08'),(2,'Admin','pesanan','Pesanan',1,1,1,1,'2026-06-12 16:38:08'),(3,'Admin','pelanggan','Pelanggan',1,1,1,1,'2026-06-12 16:38:08'),(4,'Admin','layanan','Layanan',1,1,1,1,'2026-06-12 16:38:08'),(5,'Admin','laporan','Laporan',1,1,1,1,'2026-06-12 16:38:08'),(6,'Admin','pembayaran','Pembayaran',1,1,1,1,'2026-06-12 16:38:08'),(7,'Admin','profile','Profile',1,1,1,1,'2026-06-12 16:38:08'),(8,'Admin','karyawan','Karyawan',1,1,1,1,'2026-06-12 16:38:08'),(9,'Admin','access_control','Access Control',1,1,1,1,'2026-06-12 16:38:08'),(10,'Kasir','dashboard','Dashboard',0,1,0,0,'2026-06-12 18:51:07'),(11,'Kasir','pesanan','Pesanan',1,1,1,0,'2026-06-12 16:38:08'),(12,'Kasir','pelanggan','Pelanggan',1,1,1,0,'2026-06-12 16:38:08'),(13,'Kasir','layanan','Layanan',0,1,0,0,'2026-06-12 18:51:37'),(14,'Kasir','laporan','Laporan',0,0,0,0,'2026-06-12 16:38:08'),(15,'Kasir','pembayaran','Pembayaran',0,1,1,0,'2026-06-12 16:38:08'),(16,'Kasir','profile','Profile',0,1,0,0,'2026-06-12 16:38:08'),(17,'Kasir','karyawan','Karyawan',0,0,0,0,'2026-06-12 16:38:08'),(18,'Kasir','access_control','Access Control',0,0,0,0,'2026-06-12 16:38:08'),(19,'Karyawan','dashboard','Dashboard',0,0,0,0,'2026-06-12 16:38:08'),(20,'Karyawan','pesanan','Pesanan',0,0,0,0,'2026-06-12 16:38:08'),(21,'Karyawan','pelanggan','Pelanggan',0,0,0,0,'2026-06-12 16:38:08'),(22,'Karyawan','layanan','Layanan',0,0,0,0,'2026-06-12 16:38:08'),(23,'Karyawan','laporan','Laporan',0,0,0,0,'2026-06-12 16:38:08'),(24,'Karyawan','pembayaran','Pembayaran',0,0,0,0,'2026-06-12 16:38:08'),(25,'Karyawan','profile','Profile',0,1,0,0,'2026-06-12 16:38:08'),(26,'Karyawan','karyawan','Karyawan',0,0,0,0,'2026-06-12 16:38:08'),(27,'Karyawan','access_control','Access Control',0,0,0,0,'2026-06-12 16:38:08');
/*!40000 ALTER TABLE `role_access_control` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL DEFAULT '1',
  `nama_laundry` varchar(100) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'Spincycle Laundry','Jawakarta','08123456789',NULL);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'railway'
--

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-14 15:11:02
