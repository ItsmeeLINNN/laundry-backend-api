// Fitur Login Karyawan
exports.login = (req, res) => {
    const { username, password } = req.body;

    // 1. Cari user di database berdasarkan username
    const sql = `SELECT * FROM karyawan WHERE username = ?`;
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Jika username tidak ditemukan
        if (results.length === 0) {
            return res.status(401).json({ error: "Username tidak terdaftar!" });
        }

        const user = results[0];

        // 2. Cek apakah akunnya masih aktif
        if (!user.status_aktif) {
            return res.status(403).json({ error: "Akun ini sudah dinonaktifkan oleh Admin." });
        }

        // 3. Cocokkan password yang diketik dengan password acak (Bcrypt) di database
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Password salah!" });
        }

        // 4. Jika sukses, kirim data nama dan jabatan untuk disimpan di HP pengguna
        res.json({
            message: "Login berhasil",
            user: {
                id: user.id,
                nama: user.nama,
                jabatan: user.jabatan // Ini akan menentukan dia Admin atau Kasir
            }
        });
    });
};