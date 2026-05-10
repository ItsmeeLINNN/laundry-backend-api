const mysql = require('mysql2');
require('dotenv').config();

// Membuat pool koneksi ke database MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ubah menjadi format Promise
const promisePool = pool.promise();

// Cek koneksi saat server pertama kali dijalankan
promisePool.getConnection()
    .then(connection => {
        console.log('✅ Berhasil terhubung ke database MySQL (laundry_android)!');
        connection.release(); // Lepaskan kembali koneksi agar tidak memberatkan server
    })
    .catch(err => {
        console.error('❌ Gagal terhubung ke database:', err.message);
    });

// Ekspor agar bisa digunakan di file lain
module.exports = promisePool;