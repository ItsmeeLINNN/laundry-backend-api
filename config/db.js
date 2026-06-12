require('dotenv').config({ quiet: true });

const mysql = require('mysql2');

function readEnv(primaryName, fallbackName) {
    return process.env[primaryName] || process.env[fallbackName] || '';
}

const dbConfig = {
    host: readEnv('DB_HOST', 'MYSQLHOST'),
    user: readEnv('DB_USER', 'MYSQLUSER'),
    password: readEnv('DB_PASSWORD', 'MYSQLPASSWORD'),
    database: readEnv('DB_NAME', 'MYSQLDATABASE'),
    port: Number(readEnv('DB_PORT', 'MYSQLPORT')),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
};

const requiredFields = [
    ['host', 'DB_HOST atau MYSQLHOST wajib diisi di Railway Backend Variables.'],
    ['user', 'DB_USER atau MYSQLUSER wajib diisi di Railway Backend Variables.'],
    ['database', 'DB_NAME atau MYSQLDATABASE wajib diisi di Railway Backend Variables.']
];

requiredFields.forEach(([field, message]) => {
    if (!dbConfig[field]) {
        throw new Error(message);
    }
});

if (!dbConfig.password) {
    throw new Error('DB_PASSWORD wajib diisi di Railway Backend Variables.');
}

if (!Number.isInteger(dbConfig.port) || dbConfig.port <= 0) {
    throw new Error('DB_PORT atau MYSQLPORT wajib berisi angka port database yang valid.');
}

if (!Number.isInteger(dbConfig.connectionLimit) || dbConfig.connectionLimit <= 0) {
    dbConfig.connectionLimit = 10;
}

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal terhubung ke MySQL:', err.message);
        return;
    }

    console.log('Berhasil terhubung ke MySQL Database (Pool).');
    connection.release();
});

module.exports = db;
