require('dotenv').config({ quiet: true });

const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nailong_laundry',
    port: Number(process.env.DB_PORT || 3306),
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
