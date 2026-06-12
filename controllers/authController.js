const db = require('../config/db');
const { signPayload } = require('../utils/jwt');

let bcrypt;

try {
    bcrypt = require('bcryptjs');
} catch (error) {
    bcrypt = require('bcrypt');
}

const LOGIN_ROLES = ['Admin', 'Kasir'];
const EMPLOYEE_ROLES = ['Admin', 'Kasir', 'Karyawan'];

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    });
}

function cleanText(value) {
    return String(value || '').trim();
}

function validNama(value) {
    return /^[A-Za-zÀ-ÿ ]{3,100}$/.test(value);
}

function validUsername(value) {
    return /^[A-Za-z0-9_]{3,50}$/.test(value);
}

function validJabatan(value) {
    return EMPLOYEE_ROLES.includes(value);
}

function validTime(value) {
    return value === null || value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isLoginRole(jabatan) {
    return LOGIN_ROLES.includes(jabatan);
}

function normalizePassword(value) {
    const password = String(value || '');
    return password.trim() === '' ? null : password;
}

exports.register = async (req, res) => {
    try {
        const {
            nama,
            username,
            password,
            no_telepon,
            alamat,
            jabatan,
            hari_kerja,
            jam_masuk,
            jam_pulang
        } = req.body;

        const namaClean = cleanText(nama);
        const jabatanClean = cleanText(jabatan || 'Karyawan');
        const usernameClean = cleanText(username);
        const noTeleponClean = cleanText(no_telepon);
        const alamatClean = cleanText(alamat);
        const hariKerjaClean = cleanText(hari_kerja);
        const jamMasukClean = jam_masuk || null;
        const jamPulangClean = jam_pulang || null;
        const passwordClean = normalizePassword(password);

        if (!namaClean || !jabatanClean) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama dan jabatan wajib diisi.'
            });
        }

        if (!validNama(namaClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama hanya boleh huruf dan spasi, minimal 3 karakter.'
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

        let usernameForDb = null;
        let passwordForDb = null;

        if (isLoginRole(jabatanClean)) {
            if (!usernameClean || !passwordClean) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Admin dan Kasir wajib memiliki username dan password.'
                });
            }

            if (!validUsername(usernameClean)) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Username hanya boleh huruf, angka, dan underscore, 3-50 karakter.'
                });
            }

            if (passwordClean.length < 8) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Password minimal 8 karakter.'
                });
            }

            usernameForDb = usernameClean;
            passwordForDb = await bcrypt.hash(passwordClean, 10);
        }

        const result = await query(`
            INSERT INTO karyawan
                (nama, username, password, no_telepon, alamat, jabatan, hari_kerja, jam_masuk, jam_pulang, status_aktif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            namaClean,
            usernameForDb,
            passwordForDb,
            noTeleponClean || null,
            alamatClean || null,
            jabatanClean,
            hariKerjaClean || null,
            jamMasukClean,
            jamPulangClean,
            1
        ]);

        return res.status(201).json({
            status: 'SUKSES',
            message: 'Karyawan berhasil didaftarkan.',
            data: {
                id: result.insertId,
                nama: namaClean,
                username: usernameForDb,
                jabatan: jabatanClean
            }
        });
    } catch (error) {
        console.error('Register karyawan error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Username sudah digunakan.'
            });
        }

        return res.status(500).json({
            status: 'ERROR',
            message: 'Terjadi kesalahan server.'
        });
    }
};

exports.getKaryawan = async (req, res) => {
    try {
        const results = await query(`
            SELECT 
                id,
                nama,
                username,
                no_telepon,
                alamat,
                jabatan,
                hari_kerja,
                jam_masuk,
                jam_pulang,
                status_aktif
            FROM karyawan
            ORDER BY id DESC
        `);

        return res.json(results);
    } catch (error) {
        console.error('Get karyawan error:', error);

        return res.status(500).json({
            status: 'ERROR',
            message: 'Gagal mengambil data karyawan.'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const usernameClean = cleanText(username);

        if (!usernameClean || !password) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Username dan password wajib diisi.'
            });
        }

        const results = await query(`
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
        `, [usernameClean]);

        if (!results || results.length === 0) {
            return res.status(401).json({
                status: 'GAGAL',
                message: 'Username atau password salah.'
            });
        }

        const user = results[0];

        if (!isLoginRole(user.jabatan)) {
            return res.status(403).json({
                status: 'GAGAL',
                message: 'Karyawan tidak diizinkan login.'
            });
        }

        if (Number(user.status_aktif) !== 1) {
            return res.status(403).json({
                status: 'GAGAL',
                message: 'Akun ini sedang nonaktif.'
            });
        }

        if (!user.password) {
            return res.status(401).json({
                status: 'GAGAL',
                message: 'Username atau password salah.'
            });
        }

        const match = await bcrypt.compare(String(password), user.password);

        if (!match) {
            return res.status(401).json({
                status: 'GAGAL',
                message: 'Username atau password salah.'
            });
        }

        const token = signPayload({
            id: user.id,
            nama: user.nama,
            username: user.username,
            jabatan: user.jabatan
        });

        return res.json({
            status: 'SUKSES',
            message: 'Login berhasil.',
            token,
            data: {
                id: user.id,
                nama: user.nama,
                username: user.username,
                jabatan: user.jabatan,
                role: user.jabatan,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            status: 'ERROR',
            message: 'Gagal memproses login.'
        });
    }
};

exports.updateKaryawan = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama,
            username,
            password,
            no_telepon,
            alamat,
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

        const existingRows = await query('SELECT id, password FROM karyawan WHERE id = ? LIMIT 1', [id]);

        if (existingRows.length === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                message: 'Karyawan tidak ditemukan.'
            });
        }

        const namaClean = cleanText(nama);
        const jabatanClean = cleanText(jabatan);
        const usernameClean = cleanText(username);
        const noTeleponClean = cleanText(no_telepon);
        const alamatClean = cleanText(alamat);
        const hariKerjaClean = cleanText(hari_kerja);
        const jamMasukClean = jam_masuk || null;
        const jamPulangClean = jam_pulang || null;
        const statusAktifValue = status_aktif === false || status_aktif === 0 || status_aktif === '0' ? 0 : 1;
        const passwordClean = normalizePassword(password);

        if (!namaClean || !jabatanClean) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama dan jabatan wajib diisi.'
            });
        }

        if (!validNama(namaClean)) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Nama hanya boleh huruf dan spasi, minimal 3 karakter.'
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

        const assignments = [
            'nama = ?',
            'username = ?',
            'no_telepon = ?',
            'alamat = ?',
            'jabatan = ?',
            'hari_kerja = ?',
            'jam_masuk = ?',
            'jam_pulang = ?',
            'status_aktif = ?'
        ];

        const values = [
            namaClean,
            null,
            noTeleponClean || null,
            alamatClean || null,
            jabatanClean,
            hariKerjaClean || null,
            jamMasukClean,
            jamPulangClean,
            statusAktifValue
        ];

        if (isLoginRole(jabatanClean)) {
            if (!usernameClean) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Admin dan Kasir wajib memiliki username.'
                });
            }

            if (!validUsername(usernameClean)) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Username hanya boleh huruf, angka, dan underscore, 3-50 karakter.'
                });
            }

            values[1] = usernameClean;

            if (passwordClean) {
                if (passwordClean.length < 8) {
                    return res.status(400).json({
                        status: 'GAGAL',
                        message: 'Password minimal 8 karakter.'
                    });
                }

                assignments.push('password = ?');
                values.push(await bcrypt.hash(passwordClean, 10));
            } else if (!existingRows[0].password) {
                return res.status(400).json({
                    status: 'GAGAL',
                    message: 'Admin dan Kasir wajib memiliki password.'
                });
            }
        } else {
            assignments.push('password = ?');
            values.push(null);
        }

        values.push(id);

        const result = await query(`
            UPDATE karyawan
            SET ${assignments.join(', ')}
            WHERE id = ?
        `, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                message: 'Karyawan tidak ditemukan.'
            });
        }

        return res.json({
            status: 'SUKSES',
            message: 'Data karyawan berhasil diperbarui.'
        });
    } catch (error) {
        console.error('Update karyawan error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'Username sudah digunakan.'
            });
        }

        return res.status(500).json({
            status: 'ERROR',
            message: 'Terjadi kesalahan server.'
        });
    }
};

exports.deleteKaryawan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[0-9]+$/.test(String(id))) {
            return res.status(400).json({
                status: 'GAGAL',
                message: 'ID karyawan tidak valid.'
            });
        }

        const result = await query('DELETE FROM karyawan WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'GAGAL',
                message: 'Karyawan tidak ditemukan.'
            });
        }

        return res.json({
            status: 'SUKSES',
            message: 'Karyawan berhasil dihapus.'
        });
    } catch (error) {
        console.error('Delete karyawan error:', error);

        return res.status(500).json({
            status: 'ERROR',
            message: 'Gagal menghapus data karyawan.'
        });
    }
};
