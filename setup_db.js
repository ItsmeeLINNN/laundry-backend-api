require('dotenv').config({ quiet: true });

const dbPool = require('./config/db');

let bcrypt;

try {
    bcrypt = require('bcryptjs');
} catch (error) {
    bcrypt = require('bcrypt');
}

const db = dbPool.promise();
const DATABASE = process.env.DB_NAME;

const ROLES = ['Admin', 'Kasir', 'Karyawan'];

const FEATURES = [
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'pesanan', name: 'Pesanan' },
    { key: 'pelanggan', name: 'Pelanggan' },
    { key: 'layanan', name: 'Layanan' },
    { key: 'laporan', name: 'Laporan' },
    { key: 'pembayaran', name: 'Pembayaran' },
    { key: 'profile', name: 'Profile' },
    { key: 'karyawan', name: 'Karyawan' },
    { key: 'access_control', name: 'Access Control' }
];

const DEFAULT_ACCESS = {
    Admin: FEATURES.reduce((acc, feature) => {
        acc[feature.key] = { create: 1, read: 1, update: 1, delete: 1 };
        return acc;
    }, {}),
    Kasir: {
        dashboard: { create: 0, read: 1, update: 0, delete: 0 },
        pesanan: { create: 1, read: 1, update: 1, delete: 0 },
        pelanggan: { create: 1, read: 1, update: 1, delete: 0 },
        layanan: { create: 0, read: 0, update: 0, delete: 0 },
        laporan: { create: 0, read: 0, update: 0, delete: 0 },
        pembayaran: { create: 0, read: 1, update: 1, delete: 0 },
        profile: { create: 0, read: 1, update: 0, delete: 0 },
        karyawan: { create: 0, read: 0, update: 0, delete: 0 },
        access_control: { create: 0, read: 0, update: 0, delete: 0 }
    },
    Karyawan: {
        dashboard: { create: 0, read: 0, update: 0, delete: 0 },
        pesanan: { create: 0, read: 0, update: 0, delete: 0 },
        pelanggan: { create: 0, read: 0, update: 0, delete: 0 },
        layanan: { create: 0, read: 0, update: 0, delete: 0 },
        laporan: { create: 0, read: 0, update: 0, delete: 0 },
        pembayaran: { create: 0, read: 0, update: 0, delete: 0 },
        profile: { create: 0, read: 1, update: 0, delete: 0 },
        karyawan: { create: 0, read: 0, update: 0, delete: 0 },
        access_control: { create: 0, read: 0, update: 0, delete: 0 }
    }
};

function requireEnv(name) {
    if (!process.env[name]) {
        throw new Error(`Environment ${name} wajib diisi.`);
    }
}

async function tableExists(tableName) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [DATABASE, tableName]
    );

    return Number(rows[0].total) > 0;
}

async function columnExists(tableName, columnName) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [DATABASE, tableName, columnName]
    );

    return Number(rows[0].total) > 0;
}

async function indexExists(tableName, indexName) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [DATABASE, tableName, indexName]
    );

    return Number(rows[0].total) > 0;
}

async function enumContains(tableName, columnName, value) {
    const [rows] = await db.query(
        `SELECT COLUMN_TYPE AS column_type
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
         LIMIT 1`,
        [DATABASE, tableName, columnName]
    );

    return rows.length > 0 && String(rows[0].column_type).includes(`'${value}'`);
}

async function addColumnIfMissing(tableName, columnName, definition) {
    if (!(await columnExists(tableName, columnName))) {
        await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
}

async function dropColumnIfExists(tableName, columnName) {
    if (await columnExists(tableName, columnName)) {
        await db.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
    }
}

async function dropIndexIfExists(tableName, indexName) {
    if (await indexExists(tableName, indexName)) {
        await db.query(`ALTER TABLE ${tableName} DROP INDEX ${indexName}`);
    }
}

async function createCoreTables() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS karyawan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100) NOT NULL,
            username VARCHAR(50) NULL,
            password VARCHAR(255) NULL,
            no_telepon VARCHAR(20) NULL,
            alamat TEXT NULL,
            jabatan ENUM('Admin','Kasir','Karyawan') NOT NULL DEFAULT 'Karyawan',
            hari_kerja VARCHAR(100) NULL,
            jam_masuk TIME NULL,
            jam_pulang TIME NULL,
            status_aktif TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS pelanggan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(100) NULL,
            address TEXT NULL,
            status_member VARCHAR(20) DEFAULT 'Non-Member',
            tgl_aktif_member DATE NULL,
            tgl_expired_member DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY pelanggan_phone_unique (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS layanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_name VARCHAR(100) NOT NULL,
            category ENUM('Kiloan','Satuan') NOT NULL,
            price INT NOT NULL,
            unit VARCHAR(20) NOT NULL,
            estimated_days INT DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS paket_layanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_paket VARCHAR(50) NOT NULL,
            estimasi_jam INT NOT NULL DEFAULT 24,
            multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
            status_aktif TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY paket_layanan_nama_unique (nama_paket)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pelanggan_id INT NOT NULL,
            paket_id INT NOT NULL,
            layanan_id INT NULL,
            berat DECIMAL(8,2) NOT NULL DEFAULT 1.00,
            metode_pengambilan VARCHAR(50) NOT NULL DEFAULT 'ambil_sendiri',
            jarak_km DECIMAL(8,2) DEFAULT 0.00,
            ongkir INT DEFAULT 0,
            total_harga INT NOT NULL,
            status_pesanan ENUM('Diproses','Selesai','Diambil') NOT NULL DEFAULT 'Diproses',
            status_pembayaran ENUM('Belum Lunas','Lunas') NOT NULL DEFAULT 'Belum Lunas',
            metode_pembayaran ENUM('Tunai','QRIS','Transfer') NULL,
            uang_diterima INT NOT NULL DEFAULT 0,
            uang_kembalian INT NOT NULL DEFAULT 0,
            kasir_id INT NULL,
            catatan TEXT NULL,
            tanggal_masuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX pesanan_pelanggan_idx (pelanggan_id),
            INDEX pesanan_layanan_idx (layanan_id),
            INDEX pesanan_kasir_idx (kasir_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS detail_pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pesanan_id INT NOT NULL,
            layanan_id INT NOT NULL,
            nama_layanan_snapshot VARCHAR(100) NOT NULL,
            kategori_snapshot VARCHAR(50) NULL,
            unit_snapshot VARCHAR(20) NULL,
            qty DECIMAL(8,2) NOT NULL,
            harga_satuan_snapshot INT NOT NULL,
            subtotal INT NOT NULL,
            INDEX detail_pesanan_pesanan_idx (pesanan_id),
            INDEX detail_pesanan_layanan_idx (layanan_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS pengeluaran (
            id INT AUTO_INCREMENT PRIMARY KEY,
            keterangan VARCHAR(255) NOT NULL,
            nominal DECIMAL(12,2) NOT NULL,
            tanggal DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS settings (
            id INT PRIMARY KEY DEFAULT 1,
            nama_laundry VARCHAR(100) NULL,
            alamat VARCHAR(255) NULL,
            telepon VARCHAR(20) NULL,
            email VARCHAR(100) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS role_access_control (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role ENUM('Admin','Kasir','Karyawan') NOT NULL,
            feature_key VARCHAR(50) NOT NULL,
            feature_name VARCHAR(100) NOT NULL,
            can_create TINYINT(1) NOT NULL DEFAULT 0,
            can_read TINYINT(1) NOT NULL DEFAULT 0,
            can_update TINYINT(1) NOT NULL DEFAULT 0,
            can_delete TINYINT(1) NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY role_feature_unique (role, feature_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
}

async function normalizeKaryawanTable() {
    await addColumnIfMissing('karyawan', 'nama', "VARCHAR(100) NOT NULL DEFAULT 'Karyawan'");
    await addColumnIfMissing('karyawan', 'username', 'VARCHAR(50) NULL');
    await addColumnIfMissing('karyawan', 'password', 'VARCHAR(255) NULL');
    await addColumnIfMissing('karyawan', 'no_telepon', 'VARCHAR(20) NULL');
    await addColumnIfMissing('karyawan', 'alamat', 'TEXT NULL');
    await addColumnIfMissing('karyawan', 'jabatan', "ENUM('Admin','Kasir','Karyawan') NOT NULL DEFAULT 'Karyawan'");
    await addColumnIfMissing('karyawan', 'hari_kerja', 'VARCHAR(100) NULL');
    await addColumnIfMissing('karyawan', 'jam_masuk', 'TIME NULL');
    await addColumnIfMissing('karyawan', 'jam_pulang', 'TIME NULL');
    await addColumnIfMissing('karyawan', 'status_aktif', 'TINYINT(1) DEFAULT 1');
    await addColumnIfMissing('karyawan', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfMissing('karyawan', 'updated_at', 'TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

    if (await enumContains('karyawan', 'jabatan', 'Kurir')) {
        await db.query("UPDATE karyawan SET jabatan = 'Karyawan' WHERE jabatan = 'Kurir'");
    }
    await db.query("UPDATE karyawan SET username = NULL, password = NULL WHERE jabatan = 'Karyawan'");
    await db.query("UPDATE karyawan SET nama = 'Karyawan' WHERE nama IS NULL OR nama = ''");

    await db.query('ALTER TABLE karyawan MODIFY nama VARCHAR(100) NOT NULL');
    await db.query('ALTER TABLE karyawan MODIFY username VARCHAR(50) NULL');
    await db.query('ALTER TABLE karyawan MODIFY password VARCHAR(255) NULL');
    await db.query('ALTER TABLE karyawan MODIFY no_telepon VARCHAR(20) NULL');
    await db.query('ALTER TABLE karyawan MODIFY alamat TEXT NULL');
    await db.query("ALTER TABLE karyawan MODIFY jabatan ENUM('Admin','Kasir','Karyawan') NOT NULL DEFAULT 'Karyawan'");
    await db.query('ALTER TABLE karyawan MODIFY hari_kerja VARCHAR(100) NULL');
    await db.query('ALTER TABLE karyawan MODIFY jam_masuk TIME NULL');
    await db.query('ALTER TABLE karyawan MODIFY jam_pulang TIME NULL');
    await db.query('ALTER TABLE karyawan MODIFY status_aktif TINYINT(1) DEFAULT 1');
    await db.query('ALTER TABLE karyawan MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await db.query('ALTER TABLE karyawan MODIFY updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

    if (!(await indexExists('karyawan', 'karyawan_username_unique'))) {
        const [duplicates] = await db.query(`
            SELECT username, COUNT(*) AS total
            FROM karyawan
            WHERE username IS NOT NULL AND username <> ''
            GROUP BY username
            HAVING COUNT(*) > 1
            LIMIT 1
        `);

        if (duplicates.length > 0) {
            throw new Error(`Username duplikat ditemukan: ${duplicates[0].username}. Bersihkan data ini sebelum membuat unique index.`);
        }

        await db.query('CREATE UNIQUE INDEX karyawan_username_unique ON karyawan (username)');
    }
}

async function normalizeSupportingTables() {
    await addColumnIfMissing('pelanggan', 'name', "VARCHAR(100) NOT NULL DEFAULT 'Pelanggan'");
    await addColumnIfMissing('pelanggan', 'phone', "VARCHAR(20) NOT NULL DEFAULT ''");
    await addColumnIfMissing('pelanggan', 'email', 'VARCHAR(100) NULL');
    await addColumnIfMissing('pelanggan', 'address', 'TEXT NULL');
    await addColumnIfMissing('pelanggan', 'status_member', "VARCHAR(20) DEFAULT 'Non-Member'");
    await addColumnIfMissing('pelanggan', 'tgl_aktif_member', 'DATE NULL');
    await addColumnIfMissing('pelanggan', 'tgl_expired_member', 'DATE NULL');

    await addColumnIfMissing('layanan', 'service_name', "VARCHAR(100) NOT NULL DEFAULT 'Layanan'");
    await addColumnIfMissing('layanan', 'category', "ENUM('Kiloan','Satuan') NOT NULL DEFAULT 'Kiloan'");
    await addColumnIfMissing('layanan', 'price', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('layanan', 'unit', "VARCHAR(20) NOT NULL DEFAULT 'kg'");
    await addColumnIfMissing('layanan', 'estimated_days', 'INT DEFAULT 1');

    await addColumnIfMissing('paket_layanan', 'nama_paket', "VARCHAR(50) NOT NULL DEFAULT 'Reguler'");
    await addColumnIfMissing('paket_layanan', 'estimasi_jam', 'INT NOT NULL DEFAULT 24');
    await addColumnIfMissing('paket_layanan', 'multiplier', 'DECIMAL(5,2) NOT NULL DEFAULT 1.00');
    await addColumnIfMissing('paket_layanan', 'status_aktif', 'TINYINT(1) DEFAULT 1');

    await addColumnIfMissing('pesanan', 'pelanggan_id', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('pesanan', 'paket_id', 'INT NOT NULL DEFAULT 1');
    await addColumnIfMissing('pesanan', 'layanan_id', 'INT NULL');
    await addColumnIfMissing('pesanan', 'berat', 'DECIMAL(8,2) NOT NULL DEFAULT 1.00');
    await addColumnIfMissing('pesanan', 'metode_pengambilan', "VARCHAR(50) NOT NULL DEFAULT 'ambil_sendiri'");
    await addColumnIfMissing('pesanan', 'jarak_km', 'DECIMAL(8,2) DEFAULT 0.00');
    await addColumnIfMissing('pesanan', 'ongkir', 'INT DEFAULT 0');
    await addColumnIfMissing('pesanan', 'total_harga', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('pesanan', 'status_pesanan', "ENUM('Diproses','Selesai','Diambil') NOT NULL DEFAULT 'Diproses'");
    await addColumnIfMissing('pesanan', 'status_pembayaran', "ENUM('Belum Lunas','Lunas') NOT NULL DEFAULT 'Belum Lunas'");
    await addColumnIfMissing('pesanan', 'metode_pembayaran', "ENUM('Tunai','QRIS','Transfer') NULL");
    await addColumnIfMissing('pesanan', 'uang_diterima', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('pesanan', 'uang_kembalian', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('pesanan', 'kasir_id', 'INT NULL');
    await addColumnIfMissing('pesanan', 'catatan', 'TEXT NULL');
    await addColumnIfMissing('pesanan', 'tanggal_masuk', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await addColumnIfMissing('detail_pesanan', 'pesanan_id', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('detail_pesanan', 'layanan_id', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('detail_pesanan', 'nama_layanan_snapshot', "VARCHAR(100) NOT NULL DEFAULT 'Layanan'");
    await addColumnIfMissing('detail_pesanan', 'kategori_snapshot', 'VARCHAR(50) NULL');
    await addColumnIfMissing('detail_pesanan', 'unit_snapshot', 'VARCHAR(20) NULL');
    await addColumnIfMissing('detail_pesanan', 'qty', 'DECIMAL(8,2) NOT NULL DEFAULT 1.00');
    await addColumnIfMissing('detail_pesanan', 'harga_satuan_snapshot', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('detail_pesanan', 'subtotal', 'INT NOT NULL DEFAULT 0');

    await addColumnIfMissing('settings', 'nama_laundry', 'VARCHAR(100) NULL');
    await addColumnIfMissing('settings', 'alamat', 'VARCHAR(255) NULL');
    await addColumnIfMissing('settings', 'telepon', 'VARCHAR(20) NULL');
    await addColumnIfMissing('settings', 'email', 'VARCHAR(100) NULL');
}

async function normalizeAccessTable() {
    await addColumnIfMissing('role_access_control', 'feature_key', 'VARCHAR(50) NULL');
    await addColumnIfMissing('role_access_control', 'feature_name', 'VARCHAR(100) NULL');
    await addColumnIfMissing('role_access_control', 'can_create', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing('role_access_control', 'can_read', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing('role_access_control', 'can_update', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing('role_access_control', 'can_delete', 'TINYINT(1) NOT NULL DEFAULT 0');

    if (await columnExists('role_access_control', 'page_key')) {
        await db.query(`
            UPDATE role_access_control
            SET feature_key = CASE
                WHEN page_key LIKE '%dashboard%' THEN 'dashboard'
                WHEN page_key LIKE '%pesanan%' OR page_key LIKE '%order%' OR page_key LIKE '%transaksi%' THEN 'pesanan'
                WHEN page_key LIKE '%pelanggan%' THEN 'pelanggan'
                WHEN page_key LIKE '%layanan%' THEN 'layanan'
                WHEN page_key LIKE '%laporan%' THEN 'laporan'
                WHEN page_key LIKE '%pembayaran%' THEN 'pembayaran'
                WHEN page_key LIKE '%profile%' THEN 'profile'
                WHEN page_key LIKE '%karyawan%' THEN 'karyawan'
                WHEN page_key LIKE '%access_control%' THEN 'access_control'
                ELSE feature_key
            END
            WHERE feature_key IS NULL
        `);
    }

    if (await columnExists('role_access_control', 'can_access')) {
        await db.query(`
            UPDATE role_access_control
            SET can_read = can_access
        `);
    }

    await db.query(`
        UPDATE role_access_control rac
        JOIN (
            SELECT 'dashboard' AS feature_key, 'Dashboard' AS feature_name UNION ALL
            SELECT 'pesanan', 'Pesanan' UNION ALL
            SELECT 'pelanggan', 'Pelanggan' UNION ALL
            SELECT 'layanan', 'Layanan' UNION ALL
            SELECT 'laporan', 'Laporan' UNION ALL
            SELECT 'pembayaran', 'Pembayaran' UNION ALL
            SELECT 'profile', 'Profile' UNION ALL
            SELECT 'karyawan', 'Karyawan' UNION ALL
            SELECT 'access_control', 'Access Control'
        ) features ON rac.feature_key = features.feature_key
        SET rac.feature_name = features.feature_name
    `);

    if (await enumContains('role_access_control', 'role', 'Kurir')) {
        await db.query(`
            UPDATE role_access_control kurir
            LEFT JOIN role_access_control karyawan
                ON karyawan.role = 'Karyawan'
                AND karyawan.feature_key = kurir.feature_key
            SET kurir.role = 'Karyawan'
            WHERE kurir.role = 'Kurir'
              AND karyawan.id IS NULL
        `);

        await db.query(`
            DELETE kurir
            FROM role_access_control kurir
            JOIN role_access_control karyawan
                ON karyawan.role = 'Karyawan'
                AND karyawan.feature_key = kurir.feature_key
            WHERE kurir.role = 'Kurir'
        `);
    }

    await db.query("UPDATE role_access_control SET feature_key = 'profile', feature_name = 'Profile' WHERE feature_key IS NULL");

    await db.query(`
        UPDATE role_access_control keep_row
        JOIN (
            SELECT
                MIN(id) AS keep_id,
                role,
                feature_key,
                MAX(can_create) AS can_create,
                MAX(can_read) AS can_read,
                MAX(can_update) AS can_update,
                MAX(can_delete) AS can_delete
            FROM role_access_control
            GROUP BY role, feature_key
        ) merged ON merged.keep_id = keep_row.id
        SET
            keep_row.can_create = merged.can_create,
            keep_row.can_read = merged.can_read,
            keep_row.can_update = merged.can_update,
            keep_row.can_delete = merged.can_delete
    `);

    await db.query(`
        DELETE duplicate_row
        FROM role_access_control duplicate_row
        JOIN (
            SELECT MIN(id) AS keep_id, role, feature_key
            FROM role_access_control
            GROUP BY role, feature_key
        ) merged ON merged.role = duplicate_row.role
            AND merged.feature_key = duplicate_row.feature_key
            AND merged.keep_id <> duplicate_row.id
    `);

    await dropIndexIfExists('role_access_control', 'role_page_unique');
    await dropColumnIfExists('role_access_control', 'page_key');
    await dropColumnIfExists('role_access_control', 'page_name');
    await dropColumnIfExists('role_access_control', 'can_access');

    await db.query("ALTER TABLE role_access_control MODIFY role ENUM('Admin','Kasir','Karyawan') NOT NULL");
    await db.query('ALTER TABLE role_access_control MODIFY feature_key VARCHAR(50) NOT NULL');
    await db.query('ALTER TABLE role_access_control MODIFY feature_name VARCHAR(100) NOT NULL');

    if (!(await indexExists('role_access_control', 'role_feature_unique'))) {
        await db.query('CREATE UNIQUE INDEX role_feature_unique ON role_access_control (role, feature_key)');
    }
}

async function seedDefaults() {
    const paketDefaults = [
        ['Hemat', 72, 1.00],
        ['Reguler', 24, 1.20],
        ['Express', 6, 2.00]
    ];

    for (const [namaPaket, estimasiJam, multiplier] of paketDefaults) {
        await db.query(`
            INSERT INTO paket_layanan (nama_paket, estimasi_jam, multiplier, status_aktif)
            SELECT ?, ?, ?, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM paket_layanan WHERE nama_paket = ?
            )
        `, [namaPaket, estimasiJam, multiplier, namaPaket]);

        await db.query(`
            UPDATE paket_layanan
            SET estimasi_jam = ?, multiplier = ?, status_aktif = 1
            WHERE nama_paket = ?
        `, [estimasiJam, multiplier, namaPaket]);
    }

    await db.query(`
        INSERT INTO settings (id, nama_laundry, alamat, telepon)
        VALUES (1, 'Spincycle Laundry', 'Alamat belum diatur', '08123456789')
        ON DUPLICATE KEY UPDATE id = id
    `);

    const accessValues = [];

    ROLES.forEach((role) => {
        FEATURES.forEach((feature) => {
            const permissions = DEFAULT_ACCESS[role][feature.key] || { create: 0, read: 0, update: 0, delete: 0 };
            accessValues.push([
                role,
                feature.key,
                feature.name,
                permissions.create,
                permissions.read,
                permissions.update,
                permissions.delete
            ]);
        });
    });

    await db.query(`
        INSERT INTO role_access_control
            (role, feature_key, feature_name, can_create, can_read, can_update, can_delete)
        VALUES ?
        ON DUPLICATE KEY UPDATE
            feature_name = VALUES(feature_name),
            can_create = VALUES(can_create),
            can_read = VALUES(can_read),
            can_update = VALUES(can_update),
            can_delete = VALUES(can_delete)
    `, [accessValues]);

    const [admins] = await db.query("SELECT COUNT(*) AS total FROM karyawan WHERE jabatan = 'Admin'");

    if (Number(admins[0].total) === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.query(`
            INSERT INTO karyawan (nama, username, password, jabatan, status_aktif)
            VALUES ('Admin', 'admin', ?, 'Admin', 1)
        `, [hashedPassword]);
    }
}

async function validateLoginRoleCredentials() {
    const [missingCredentials] = await db.query(`
        SELECT id, nama, jabatan
        FROM karyawan
        WHERE jabatan IN ('Admin', 'Kasir')
          AND (
              username IS NULL OR username = ''
              OR password IS NULL OR password = ''
          )
        LIMIT 5
    `);

    if (missingCredentials.length > 0) {
        const ids = missingCredentials
            .map((row) => `${row.jabatan}#${row.id} ${row.nama}`)
            .join(', ');

        throw new Error(`Admin/Kasir wajib punya username dan password. Perbaiki data: ${ids}`);
    }
}

async function runSetup() {
    ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'].forEach(requireEnv);

    console.log('Memulai setup database Spincycle untuk Railway MySQL...');

    await createCoreTables();
    await normalizeKaryawanTable();
    await normalizeSupportingTables();
    await normalizeAccessTable();
    await seedDefaults();
    await validateLoginRoleCredentials();

    console.log('Setup database selesai. Tidak ada tabel production yang di-DROP.');
}

runSetup()
    .then(() => {
        dbPool.end();
        process.exit(0);
    })
    .catch((error) => {
        console.error('Setup database gagal:', error.message);
        dbPool.end();
        process.exit(1);
    });
