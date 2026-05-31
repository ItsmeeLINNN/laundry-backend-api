const mysql = require('mysql2'); // atau 'mysql2' tergantung yang kamu install

// Menggunakan createPool agar koneksi otomatis di-refresh jika terputus
const db = mysql.createPool({
    host: 'kodama.proxy.rlwy.net',
    user: 'root',
    password: 'MvHIXgtjhHZQdiujsuNMHDaDSudQppey', // Pastikan password ini sesuai dengan di Railway kamu
    database: 'railway',
    port: 11020,
    waitForConnections: true,
    connectionLimit: 10,  // Batas antrean koneksi
    queueLimit: 0
});

// Mengetes apakah kolam koneksi berhasil dibuat
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error menghubungkan ke MySQL Railway:', err.message);
    } else {
        console.log('Berhasil terhubung ke MySQL Database (Pool)!');
        connection.release(); // Kembalikan koneksi ke kolam setelah dites
    }
});

module.exports = db;