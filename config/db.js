const mysql = require('mysql2');
require('dotenv').config();

const missingMessage = 'Environment database belum lengkap. Isi DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, dan DB_PORT di Railway Backend Variables. DB_PASSWORD tidak boleh kosong.';

const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
};

const required = [
    ['DB_HOST/MYSQLHOST', dbConfig.host],
    ['DB_USER/MYSQLUSER', dbConfig.user],
    ['DB_PASSWORD/MYSQLPASSWORD', dbConfig.password],
    ['DB_NAME/MYSQLDATABASE', dbConfig.database],
    ['DB_PORT/MYSQLPORT', dbConfig.port]
];

function isMissing(name, value) {
    if (name === 'DB_PASSWORD/MYSQLPASSWORD') {
        return value === undefined || value === null || String(value).trim() === '';
    }
    return value === undefined || value === null || value === '' || Number.isNaN(value);
}

for (const [name, value] of required) {
    if (isMissing(name, value)) {
        throw new Error(`${missingMessage} Missing: ${name}`);
    }
}

if (!Number.isInteger(dbConfig.connectionLimit) || dbConfig.connectionLimit <= 0) {
    dbConfig.connectionLimit = 10;
}

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal koneksi ke MySQL Database:', err.message);
        return;
    }

    console.log('Berhasil terhubung ke MySQL Database (Pool).');
    connection.release();
});

module.exports = db;
