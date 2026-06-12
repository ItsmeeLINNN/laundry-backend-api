require('dotenv').config({ quiet: true });

const mysql = require('mysql2');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];

requiredEnv.forEach((name) => {
    if (!process.env[name]) {
        throw new Error(`Environment ${name} wajib diisi untuk koneksi database.`);
    }
});

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal terhubung ke MySQL:', err.message);
        return;
    }

    console.log('Berhasil terhubung ke MySQL Database (Pool).');
    connection.release();
});

module.exports = db;
