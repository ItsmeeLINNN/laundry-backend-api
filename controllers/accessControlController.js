const db = require('../config/db');
const { fail, ok } = require('../utils/apiResponse');

const ROLES = ['Admin', 'Kasir', 'Karyawan', 'Kurir'];

const PAGES = [
    { page_key: 'dashboard.html', page_name: 'Dashboard' },
    { page_key: 'transaksi_baru.html', page_name: 'Transaksi Baru' },
    { page_key: 'ringkasan_pesanan.html', page_name: 'Ringkasan Pesanan' },
    { page_key: 'list_order.html', page_name: 'Daftar Pesanan' },
    { page_key: 'pembayaran.html', page_name: 'Pembayaran' },
    { page_key: 'pelanggan_tambah.html', page_name: 'Pelanggan' },
    { page_key: 'layanan.html', page_name: 'Layanan' },
    { page_key: 'laporan.html', page_name: 'Laporan Keuangan' },
    { page_key: 'profile.html', page_name: 'Profil' },
    { page_key: 'karyawan.html', page_name: 'Manajemen Karyawan' },
    { page_key: 'access_control.html', page_name: 'Kontrol Akses' }
];

const DEFAULT_ACCESS = {
    Admin: PAGES.map((page) => page.page_key),
    Kasir: [
        'dashboard.html',
        'transaksi_baru.html',
        'ringkasan_pesanan.html',
        'list_order.html',
        'pembayaran.html',
        'pelanggan_tambah.html',
        'layanan.html',
        'profile.html'
    ],
    Karyawan: [
        'dashboard.html',
        'transaksi_baru.html',
        'ringkasan_pesanan.html',
        'list_order.html',
        'pelanggan_tambah.html',
        'layanan.html',
        'profile.html'
    ],
    Kurir: [
        'dashboard.html',
        'list_order.html',
        'profile.html'
    ]
};

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

function normalizePage(value) {
    const page = String(value || 'dashboard.html').split('/').pop().split('?')[0] || 'dashboard.html';
    return page === '' ? 'dashboard.html' : page;
}

function fallbackRows() {
    const rows = [];

    ROLES.forEach((role) => {
        PAGES.forEach((page) => {
            rows.push({
                role,
                page_key: page.page_key,
                page_name: page.page_name,
                can_access: DEFAULT_ACCESS[role].includes(page.page_key) ? 1 : 0
            });
        });
    });

    return rows;
}

async function ensureDefaultRows() {
    const values = [];

    ROLES.forEach((role) => {
        PAGES.forEach((page) => {
            values.push([
                role,
                page.page_key,
                page.page_name,
                DEFAULT_ACCESS[role].includes(page.page_key) ? 1 : 0
            ]);
        });
    });

    await query(`
        INSERT INTO role_access_control (role, page_key, page_name, can_access)
        VALUES ?
        ON DUPLICATE KEY UPDATE page_name = VALUES(page_name)
    `, [values]);
}

exports.listAccess = async (req, res) => {
    try {
        await ensureDefaultRows();
        const rows = await query(`
            SELECT role, page_key, page_name, can_access
            FROM role_access_control
            ORDER BY FIELD(role, 'Admin', 'Kasir', 'Karyawan', 'Kurir'), page_key ASC
        `);

        return ok(res, {
            roles: ROLES,
            pages: PAGES,
            access: rows
        }, 'Data kontrol akses berhasil diambil.');
    } catch (error) {
        console.error('GET /api/access-control error:', error);

        return ok(res, {
            roles: ROLES,
            pages: PAGES,
            access: fallbackRows(),
            fallback: true
        }, 'Menggunakan kontrol akses default karena tabel belum tersedia.');
    }
};

exports.checkMyAccess = async (req, res) => {
    const role = req.user?.jabatan || 'Karyawan';
    const page = normalizePage(req.query.path || req.query.page);

    if (role === 'Admin') {
        return ok(res, { allowed: true, role, page }, 'Akses diberikan.');
    }

    try {
        const rows = await query(`
            SELECT can_access
            FROM role_access_control
            WHERE role = ? AND page_key = ?
            LIMIT 1
        `, [role, page]);

        const allowed = rows.length > 0
            ? Number(rows[0].can_access) === 1
            : (DEFAULT_ACCESS[role] || []).includes(page);

        return ok(res, { allowed, role, page }, allowed ? 'Akses diberikan.' : 'Akses ditolak.');
    } catch (error) {
        const allowed = (DEFAULT_ACCESS[role] || []).includes(page);
        return ok(res, { allowed, role, page, fallback: true }, allowed ? 'Akses default diberikan.' : 'Akses default ditolak.');
    }
};

exports.updateAccess = async (req, res) => {
    const { role, page_key } = req.params;
    const { can_access } = req.body;
    const page = PAGES.find((item) => item.page_key === page_key);

    if (!ROLES.includes(role) || !page) {
        return fail(res, 'Role atau halaman tidak valid.', 400);
    }

    if (role === 'Admin' && can_access === false) {
        return fail(res, 'Akses Admin tidak boleh dimatikan.', 400);
    }

    try {
        await query(`
            INSERT INTO role_access_control (role, page_key, page_name, can_access)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE can_access = VALUES(can_access), page_name = VALUES(page_name)
        `, [role, page.page_key, page.page_name, can_access ? 1 : 0]);

        return ok(res, {
            role,
            page_key: page.page_key,
            can_access: can_access ? 1 : 0
        }, 'Kontrol akses berhasil diperbarui.');
    } catch (error) {
        console.error('PUT /api/access-control error:', error);
        return fail(res, 'Gagal memperbarui kontrol akses.', 500);
    }
};
