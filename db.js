const mysql = require('mysql2');

// Konfigurasi Koneksi ke MySQL Laragon
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       
    password: '',       
    database: 'nailong_laundry' // <-- NAMA DATABASE SUDAH DIUBAH
});

// Eksekusi Koneksi
db.connect((err) => {
    if (err) {
        console.error('❌ Gagal koneksi ke MySQL:', err.message);
        return;
    }
    console.log('✅ Sukses terhubung ke database MySQL: nailong_laundry');
});

module.exports = db;