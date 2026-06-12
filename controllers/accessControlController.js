const db = require('../config/db');
const { fail, ok } = require('../utils/apiResponse');

const ROLES = ['Admin', 'Kasir', 'Karyawan'];

const FEATURES = [
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'pesanan', name: 'Pesanan' },
    { key: 'pelanggan', name: 'Pelanggan' },
    { key: 'layanan', name: 'Layanan' },
    { key: 'laporan', name: 'Laporan' },
    { key: 'pembayaran', name: 'Pembayaran' },
    { key: 'profile', name: 'Profile' },
    { key: 'karyawan', name: 'Karyawan' },
    { key: 'access_control', name: 'Access Control' }
];

const DEFAULT_ACCESS = {
    Admin: FEATURES.reduce((acc, feature) => {
        acc[feature.key] = { create: 1, read: 1, update: 1, delete: 1 };
        return acc;
    }, {}),
    Kasir: {
        dashboard: { create: 0, read: 1, update: 0, delete: 0 },
        pesanan: { create: 1, read: 1, update: 1, delete: 0 },
        pelanggan: { create: 1, read: 1, update: 1, delete: 0 },
        layanan: { create: 0, read: 0, update: 0, delete: 0 },
        laporan: { create: 0, read: 0, update: 0, delete: 0 },
        pembayaran: { create: 0, read: 1, update: 1, delete: 0 },
        profile: { create: 0, read: 1, update: 0, delete: 0 },
        karyawan: { create: 0, read: 0, update: 0, delete: 0 },
        access_control: { create: 0, read: 0, update: 0, delete: 0 }
    },
    Karyawan: {
        dashboard: { create: 0, read: 0, update: 0, delete: 0 },
        pesanan: { create: 0, read: 0, update: 0, delete: 0 },
        pelanggan: { create: 0, read: 0, update: 0, delete: 0 },
        layanan: { create: 0, read: 0, update: 0, delete: 0 },
        laporan: { create: 0, read: 0, update: 0, delete: 0 },
        pembayaran: { create: 0, read: 0, update: 0, delete: 0 },
        profile: { create: 0, read: 1, update: 0, delete: 0 },
        karyawan: { create: 0, read: 0, update: 0, delete: 0 },
        access_control: { create: 0, read: 0, update: 0, delete: 0 }
    }
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

function featureByKey(key) {
    return FEATURES.find((feature) => feature.key === key);
}

function defaultPermissions(role, featureKey) {
    return DEFAULT_ACCESS[role]?.[featureKey] || { create: 0, read: 0, update: 0, delete: 0 };
}

function fallbackRows() {
    const rows = [];

    ROLES.forEach((role) => {
        FEATURES.forEach((feature) => {
            const permissions = defaultPermissions(role, feature.key);
            rows.push({
                role,
                feature_key: feature.key,
                feature_name: feature.name,
                can_create: permissions.create,
                can_read: permissions.read,
                can_update: permissions.update,
                can_delete: permissions.delete
            });
        });
    });

    return rows;
}

function toBit(value, fallback) {
    if (typeof value === 'undefined') {
        return Number(fallback) === 1 ? 1 : 0;
    }

    return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function normalizeFeature(value) {
    const raw = String(value || 'dashboard')
        .split('/')
        .pop()
        .split('?')[0]
        .replace('.html', '')
        .replace(/-/g, '_')
        .toLowerCase();

    if (featureByKey(raw)) {
        return raw;
    }

    if (raw.includes('dashboard')) return 'dashboard';
    if (raw.includes('pesanan') || raw.includes('order') || raw.includes('transaksi') || raw.includes('ringkasan')) return 'pesanan';
    if (raw.includes('pelanggan')) return 'pelanggan';
    if (raw.includes('layanan')) return 'layanan';
    if (raw.includes('laporan')) return 'laporan';
    if (raw.includes('pembayaran')) return 'pembayaran';
    if (raw.includes('profile') || raw.includes('profil')) return 'profile';
    if (raw.includes('karyawan')) return 'karyawan';
    if (raw.includes('access_control') || raw.includes('akses')) return 'access_control';

    return 'dashboard';
}

async function ensureDefaultRows() {
    const values = [];

    ROLES.forEach((role) => {
        FEATURES.forEach((feature) => {
            const permissions = defaultPermissions(role, feature.key);
            values.push([
                role,
                feature.key,
                feature.name,
                permissions.create,
                permissions.read,
                permissions.update,
                permissions.delete
            ]);
        });
    });

    await query(`
        INSERT INTO role_access_control
            (role, feature_key, feature_name, can_create, can_read, can_update, can_delete)
        VALUES ?
        ON DUPLICATE KEY UPDATE feature_name = VALUES(feature_name)
    `, [values]);
}

exports.listAccess = async (req, res) => {
    try {
        await ensureDefaultRows();

        const rows = await query(`
            SELECT role, feature_key, feature_name, can_create, can_read, can_update, can_delete
            FROM role_access_control
            ORDER BY FIELD(role, 'Admin', 'Kasir', 'Karyawan'), feature_key ASC
        `);

        return ok(res, {
            roles: ROLES,
            features: FEATURES,
            access: rows
        }, 'Data kontrol akses berhasil diambil.');
    } catch (error) {
        console.error('GET /api/access-control error:', error);

        return ok(res, {
            roles: ROLES,
            features: FEATURES,
            access: fallbackRows(),
            fallback: true
        }, 'Menggunakan kontrol akses default karena tabel belum tersedia.');
    }
};

exports.checkMyAccess = async (req, res) => {
    const role = req.user?.jabatan || 'Karyawan';
    const featureKey = normalizeFeature(req.query.feature || req.query.path || req.query.page);

    if (role === 'Admin') {
        return ok(res, { allowed: true, role, feature_key: featureKey }, 'Akses diberikan.');
    }

    try {
        const rows = await query(`
            SELECT can_read
            FROM role_access_control
            WHERE role = ? AND feature_key = ?
            LIMIT 1
        `, [role, featureKey]);

        const allowed = rows.length > 0
            ? Number(rows[0].can_read) === 1
            : Number(defaultPermissions(role, featureKey).read) === 1;

        return ok(res, { allowed, role, feature_key: featureKey }, allowed ? 'Akses diberikan.' : 'Akses ditolak.');
    } catch (error) {
        const allowed = Number(defaultPermissions(role, featureKey).read) === 1;

        return ok(res, {
            allowed,
            role,
            feature_key: featureKey,
            fallback: true
        }, allowed ? 'Akses default diberikan.' : 'Akses default ditolak.');
    }
};

exports.updateAccess = async (req, res) => {
    const { role, feature_key: featureKeyParam } = req.params;
    const featureKey = normalizeFeature(featureKeyParam);
    const feature = featureByKey(featureKey);

    if (!ROLES.includes(role) || !feature) {
        return fail(res, 'Role atau fitur tidak valid.', 400);
    }

    if (role === 'Admin') {
        const wantsDisabled = ['can_create', 'can_read', 'can_update', 'can_delete', 'can_access']
            .some((key) => Object.prototype.hasOwnProperty.call(req.body, key) && toBit(req.body[key], 1) === 0);

        if (wantsDisabled) {
            return fail(res, 'Akses Admin tidak boleh dimatikan.', 400);
        }
    }

    try {
        await ensureDefaultRows();

        const existingRows = await query(`
            SELECT can_create, can_read, can_update, can_delete
            FROM role_access_control
            WHERE role = ? AND feature_key = ?
            LIMIT 1
        `, [role, feature.key]);

        const fallback = existingRows[0] || defaultPermissions(role, feature.key);
        const canAccess = req.body.can_access;
        const permissions = {
            create: toBit(req.body.can_create, fallback.can_create ?? fallback.create),
            read: toBit(
                typeof req.body.can_read === 'undefined' ? canAccess : req.body.can_read,
                fallback.can_read ?? fallback.read
            ),
            update: toBit(req.body.can_update, fallback.can_update ?? fallback.update),
            delete: toBit(req.body.can_delete, fallback.can_delete ?? fallback.delete)
        };

        await query(`
            INSERT INTO role_access_control
                (role, feature_key, feature_name, can_create, can_read, can_update, can_delete)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                feature_name = VALUES(feature_name),
                can_create = VALUES(can_create),
                can_read = VALUES(can_read),
                can_update = VALUES(can_update),
                can_delete = VALUES(can_delete)
        `, [
            role,
            feature.key,
            feature.name,
            permissions.create,
            permissions.read,
            permissions.update,
            permissions.delete
        ]);

        return ok(res, {
            role,
            feature_key: feature.key,
            can_create: permissions.create,
            can_read: permissions.read,
            can_update: permissions.update,
            can_delete: permissions.delete
        }, 'Kontrol akses berhasil diperbarui.');
    } catch (error) {
        console.error('PUT /api/access-control error:', error);
        return fail(res, 'Gagal memperbarui kontrol akses.', 500);
    }
};
