const db = require('../config/db');

let bcrypt;

try {
    bcrypt = require('bcryptjs');
} catch (error) {
    bcrypt = require('bcrypt');
}

function cleanText(value) {
    return String(value || '').trim();
}

function validNama(value) {
    return /^[A-Za-zÀ-ÿ ]{3,50}$/.test(value);
}

function validUsername(value) {
    return /^[A-Za-z0-9_]{3,20}$/.test(value);
}

function validJabatan(value) {
    return ['Admin', 'Kasir', 'Kurir'].includes(value);
}

function validTime(value) {
    return value === null || value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

exports.register = async (req, res) => {
    try {
        const {
            nama,
            username,
            password,
            no_telepon,
            jabatan,
            hari_kerja,
            jam_masuk,
            jam_pulang
        } = req.body;

        const namaClean = cleanText(nama);
        const usernameClean = cleanText(username);
        const jabatanClean = cleanText(jabatan || 'Kasir');
        const noTeleponClean = cleanText(no_telepon);
        const hariKerjaClean = cleanText(hari_kerja);
        const jamMasukClean = jam_masuk || null;
        const jamPulangClean = jam_pulang || null;

        if (!namaClean || !usernameClean || !password || !jabatanClean) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama, username, password, dan jabatan wajib diisi.'
            });
        }

        if (!validNama(namaClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama hanya boleh huruf dan spasi, minimal 3 karakter.'
            });
        }

        if (!validUsername(usernameClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Username hanya boleh huruf, angka, dan underscore, 3-20 karakter.'
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Password minimal 8 karakter.'
            });
        }

        if (!validJabatan(jabatanClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Jabatan tidak valid.'
            });
        }

        if (!validTime(jamMasukClean) || !validTime(jamPulangClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Format jam tidak valid.'
            });
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);

        const sql = `
            INSERT INTO karyawan
            (nama, username, password, no_telepon, jabatan, hari_kerja, jam_masuk, jam_pulang, status_aktif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            namaClean,
            usernameClean,
            hashedPassword,
            noTeleponClean || null,
            jabatanClean,
            hariKerjaClean || null,
            jamMasukClean,
            jamPulangClean,
            1
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Register karyawan error:', err);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        status: 'GAGAL',
                        message: 'Username sudah digunakan.'
                    });
                }

                return res.status(500).json({
                    status: 'ERROR',
                    message: 'Gagal mendaftarkan karyawan.'
                });
            }

            res.status(201).json({
                status: 'SUKSES',
                message: 'Karyawan berhasil didaftarkan.',
                data: {
                    id: result.insertId,
                    nama: namaClean,
                    username: usernameClean,
                    jabatan: jabatanClean
                }
            });
        });
    } catch (error) {
        console.error('Register karyawan error:', error);

        res.status(500).json({
            status: 'ERROR',
            message: 'Terjadi kesalahan server.'
        });
    }
};

exports.getKaryawan = (req, res) => {
    const sql = `
        SELECT 
            id,
            nama,
            username,
            no_telepon,
            jabatan,
            hari_kerja,
            jam_masuk,
            jam_pulang,
            status_aktif
        FROM karyawan
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Get karyawan error:', err);

            return res.status(500).json({
                status: 'ERROR',
                message: 'Gagal mengambil data karyawan.'
            });
        }

        res.json(results);
    });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    const usernameClean = cleanText(username);

    if (!usernameClean || !password) {
        return res.status(400).json({
            status: 'GAGAL',
            message: 'Username dan password wajib diisi.'
        });
    }

    const sql = `
        SELECT 
            id,
            nama,
            username,
            password,
            jabatan,
            status_aktif
        FROM karyawan
        WHERE username = ?
        LIMIT 1
    `;

    db.query(sql, [usernameClean], async (err, results) => {
        if (err) {
            console.error('Login error:', err);

            return res.status(500).json({
                status: 'ERROR',
                message: 'Gagal login.'
            });
        }

        if (!results || results.length === 0) {
            return res.status(401).json({
                status: 'GAGAL',
                message: 'Username atau password salah.'
            });
        }

        const user = results[0];

        if (Number(user.status_aktif) !== 1) {
            return res.status(403).json({
                status: 'GAGAL',
                message: 'Akun ini sedang nonaktif.'
            });
        }

        try {
            const match = await bcrypt.compare(String(password), user.password);

            if (!match) {
                return res.status(401).json({
                    status: 'GAGAL',
                    message: 'Username atau password salah.'
                });
            }

            res.json({
                status: 'SUKSES',
                message: 'Login berhasil.',
                data: {
                    id: user.id,
                    nama: user.nama,
                    username: user.username,
                    jabatan: user.jabatan,
                    role: user.jabatan
                }
            });
        } catch (error) {
            console.error('Compare password error:', error);

            res.status(500).json({
                status: 'ERROR',
                message: 'Gagal memproses login.'
            });
        }
    });
};

exports.updateKaryawan = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama,
            username,
            password,
            no_telepon,
            jabatan,
            hari_kerja,
            jam_masuk,
            jam_pulang,
            status_aktif
        } = req.body;

        if (!/^[0-9]+$/.test(String(id))) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'ID karyawan tidak valid.'
            });
        }

        const namaClean = cleanText(nama);
        const usernameClean = cleanText(username);
        const jabatanClean = cleanText(jabatan);
        const noTeleponClean = cleanText(no_telepon);
        const hariKerjaClean = cleanText(hari_kerja);
        const jamMasukClean = jam_masuk || null;
        const jamPulangClean = jam_pulang || null;
        const statusAktifValue = status_aktif === false || status_aktif === 0 || status_aktif === '0' ? 0 : 1;

        if (!namaClean || !usernameClean || !jabatanClean) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama, username, dan jabatan wajib diisi.'
            });
        }

        if (!validNama(namaClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama hanya boleh huruf dan spasi, minimal 3 karakter.'
            });
        }

        if (!validUsername(usernameClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Username hanya boleh huruf, angka, dan underscore.'
            });
        }

        if (!validJabatan(jabatanClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Jabatan tidak valid.'
            });
        }

        if (!validTime(jamMasukClean) || !validTime(jamPulangClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Format jam tidak valid.'
            });
        }

        let sql;
        let values;

        if (password && String(password).trim() !== '') {
            if (String(password).length < 8) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Password minimal 8 karakter.'
                });
            }

            const hashedPassword = await bcrypt.hash(String(password), 10);

            sql = `
                UPDATE karyawan
                SET 
                    nama = ?,
                    username = ?,
                    password = ?,
                    no_telepon = ?,
                    jabatan = ?,
                    hari_kerja = ?,
                    jam_masuk = ?,
                    jam_pulang = ?,
                    status_aktif = ?
                WHERE id = ?
            `;

            values = [
                namaClean,
                usernameClean,
                hashedPassword,
                noTeleponClean || null,
                jabatanClean,
                hariKerjaClean || null,
                jamMasukClean,
                jamPulangClean,
                statusAktifValue,
                id
            ];
        } else {
            sql = `
                UPDATE karyawan
                SET 
                    nama = ?,
                    username = ?,
                    no_telepon = ?,
                    jabatan = ?,
                    hari_kerja = ?,
                    jam_masuk = ?,
                    jam_pulang = ?,
                    status_aktif = ?
                WHERE id = ?
            `;

            values = [
                namaClean,
                usernameClean,
                noTeleponClean || null,
                jabatanClean,
                hariKerjaClean || null,
                jamMasukClean,
                jamPulangClean,
                statusAktifValue,
                id
            ];
        }

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Update karyawan error:', err);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        status: 'GAGAL',
                        message: 'Username sudah digunakan.'
                    });
                }

                return res.status(500).json({
                    status: 'ERROR',
                    message: 'Gagal mengubah data karyawan.'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: 'GAGAL',
                    message: 'Karyawan tidak ditemukan.'
                });
            }

            res.json({
                status: 'SUKSES',
                message: 'Data karyawan berhasil diperbarui.'
            });
        });
    } catch (error) {
        console.error('Update karyawan error:', error);

        res.status(500).json({
            status: 'ERROR',
            message: 'Terjadi kesalahan server.'
        });
    }
};

exports.deleteKaryawan = (req, res) => {
    const { id } = req.params;

    if (!/^[0-9]+$/.test(String(id))) {
        return res.status(400).json({
            status: 'GAGAL',
            message: 'ID karyawan tidak valid.'
        });
    }

    db.query('DELETE FROM karyawan WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Delete karyawan error:', err);

            return res.status(500).json({
                status: 'ERROR',
                message: 'Gagal menghapus data karyawan.'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                message: 'Karyawan tidak ditemukan.'
            });
        }

        res.json({
            status: 'SUKSES',
            message: 'Karyawan berhasil dihapus.'
        });
    });
};