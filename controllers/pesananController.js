const db = require('../config/db');

const STATUS_PESANAN = ['Diproses', 'Selesai', 'Diambil'];
const STATUS_PEMBAYARAN = ['Belum Lunas', 'Lunas'];
const METODE_PEMBAYARAN = ['Tunai', 'QRIS', 'Transfer'];

function fail(res, statusCode, message) {
    return res.status(statusCode).json({
        status: statusCode >= 500 ? 'ERROR' : 'GAGAL',
        pesan: message,
        message
    });
}

function query(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    });
}

function normalizeItems(body) {
    if (Array.isArray(body.items) && body.items.length > 0) {
        return body.items.map((item) => ({
            layanan_id: Number(item.layanan_id || item.id),
            qty: Number(item.qty || item.berat || 0)
        }));
    }

    if (body.layanan_id) {
        return [{
            layanan_id: Number(body.layanan_id),
            qty: Number(body.berat || body.qty || 1)
        }];
    }

    return [];
}

function groupDetails(details) {
    return details.reduce((acc, item) => {
        const pesananId = String(item.pesanan_id);

        if (!acc[pesananId]) {
            acc[pesananId] = [];
        }

        acc[pesananId].push({
            id: item.id,
            layanan_id: item.layanan_id,
            service_name: item.nama_layanan_snapshot,
            category: item.kategori_snapshot,
            unit: item.unit_snapshot,
            qty: Number(item.qty),
            price: Number(item.harga_satuan_snapshot),
            subtotal: Number(item.subtotal)
        });

        return acc;
    }, {});
}

exports.buatPesanan = (req, res) => {
    const {
        pelanggan_id,
        paket_id,
        metode_pengambilan,
        jarak_km,
        total_harga,
        catatan
    } = req.body;

    const pelangganId = Number(pelanggan_id);
    const paketId = Number(paket_id);
    const totalHarga = Number(total_harga);
    const items = normalizeItems(req.body);

    if (!pelangganId || !paketId || !totalHarga || items.length === 0) {
        return fail(res, 400, 'Data pelanggan, paket, total harga, dan item layanan wajib dikirim.');
    }

    const invalidItem = items.find((item) => !item.layanan_id || item.qty <= 0);

    if (invalidItem) {
        return fail(res, 400, 'Setiap item pesanan wajib memiliki layanan dan kuantitas lebih dari 0.');
    }

    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Koneksi pesanan error:', err);
            return fail(res, 500, 'Gagal membuka koneksi database.');
        }

        try {
            await query(connection, 'START TRANSACTION');

            const layananIds = [...new Set(items.map((item) => item.layanan_id))];
            const layananRows = await query(connection, `
                SELECT id, service_name, category, price, unit
                FROM layanan
                WHERE id IN (?)
            `, [layananIds]);

            if (layananRows.length !== layananIds.length) {
                await query(connection, 'ROLLBACK');
                return fail(res, 400, 'Ada layanan yang tidak ditemukan.');
            }

            const layananMap = new Map(layananRows.map((item) => [Number(item.id), item]));
            const firstItem = items[0];
            const firstLayanan = layananMap.get(firstItem.layanan_id);
            const ongkir = Number(req.body.ongkir || 0);
            const jarak = Number(jarak_km || 0);
            const kasirId = Number(req.user?.id || req.body.kasir_id || 0) || null;

            const insertResult = await query(connection, `
                INSERT INTO pesanan
                (pelanggan_id, paket_id, layanan_id, berat, metode_pengambilan, jarak_km, ongkir, total_harga, status_pesanan, status_pembayaran, metode_pembayaran, uang_diterima, uang_kembalian, kasir_id, catatan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Diproses', 'Belum Lunas', NULL, 0, 0, ?, ?)
            `, [
                pelangganId,
                paketId,
                firstItem.layanan_id,
                firstItem.qty,
                metode_pengambilan || 'ambil_sendiri',
                jarak,
                ongkir,
                totalHarga,
                kasirId,
                catatan || null
            ]);

            const pesananId = insertResult.insertId;
            const detailValues = items.map((item) => {
                const layanan = layananMap.get(item.layanan_id);
                const subtotal = Math.round(Number(layanan.price) * Number(item.qty));

                return [
                    pesananId,
                    layanan.id,
                    layanan.service_name,
                    layanan.category,
                    layanan.unit,
                    item.qty,
                    layanan.price,
                    subtotal
                ];
            });

            await query(connection, `
                INSERT INTO detail_pesanan
                (pesanan_id, layanan_id, nama_layanan_snapshot, kategori_snapshot, unit_snapshot, qty, harga_satuan_snapshot, subtotal)
                VALUES ?
            `, [detailValues]);

            await query(connection, 'COMMIT');

            return res.status(201).json({
                status: 'SUKSES',
                pesan: 'Pesanan berhasil disimpan.',
                message: 'Pesanan berhasil disimpan.',
                nota_id: pesananId,
                data: {
                    id: pesananId,
                    pelanggan_id: pelangganId,
                    layanan_id: firstLayanan.id,
                    total_harga: totalHarga,
                    items: detailValues.length
                }
            });
        } catch (error) {
            await query(connection, 'ROLLBACK').catch(() => {});
            console.error('Error simpan pesanan:', error);
            return fail(res, 500, 'Gagal menyimpan data transaksi baru.');
        } finally {
            connection.release();
        }
    });
};

exports.getListPesanan = async (req, res) => {
    const { status_pesanan, status_pembayaran } = req.query;

    let sql = `
        SELECT
            p.*,
            c.name AS nama_pelanggan,
            c.phone AS no_hp,
            l.service_name,
            l.category,
            l.unit
        FROM pesanan p
        JOIN pelanggan c ON p.pelanggan_id = c.id
        LEFT JOIN layanan l ON p.layanan_id = l.id
        WHERE 1=1
    `;
    const params = [];

    if (status_pesanan) {
        sql += ' AND p.status_pesanan = ?';
        params.push(status_pesanan);
    }

    if (status_pembayaran) {
        sql += ' AND p.status_pembayaran = ?';
        params.push(status_pembayaran);
    }

    try {
        const orders = await new Promise((resolve, reject) => {
            db.query(`${sql} ORDER BY p.tanggal_masuk DESC, p.id DESC`, params, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });

        if (!orders.length) {
            return res.json([]);
        }

        const ids = orders.map((order) => order.id);
        const details = await new Promise((resolve, reject) => {
            db.query(`
                SELECT id, pesanan_id, layanan_id, nama_layanan_snapshot, kategori_snapshot, unit_snapshot, qty, harga_satuan_snapshot, subtotal
                FROM detail_pesanan
                WHERE pesanan_id IN (?)
                ORDER BY id ASC
            `, [ids], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });

        const detailByOrder = groupDetails(details);

        return res.json(orders.map((order) => ({
            ...order,
            items: detailByOrder[String(order.id)] || []
        })));
    } catch (error) {
        console.error('Error ambil list pesanan:', error);
        return fail(res, 500, 'Gagal mengambil data pesanan.');
    }
};

exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const {
        status_pesanan,
        status_pembayaran,
        metode_pembayaran,
        uang_diterima,
        uang_kembalian
    } = req.body;

    if (!/^[0-9]+$/.test(String(id))) {
        return fail(res, 400, 'ID pesanan tidak valid.');
    }

    if (status_pesanan && !STATUS_PESANAN.includes(status_pesanan)) {
        return fail(res, 400, 'Status pesanan tidak valid.');
    }

    if (status_pembayaran && !STATUS_PEMBAYARAN.includes(status_pembayaran)) {
        return fail(res, 400, 'Status pembayaran tidak valid.');
    }

    if (metode_pembayaran && !METODE_PEMBAYARAN.includes(metode_pembayaran)) {
        return fail(res, 400, 'Metode pembayaran tidak valid.');
    }

    const fields = [];
    const values = [];

    if (status_pesanan) {
        fields.push('status_pesanan = ?');
        values.push(status_pesanan);
    }

    if (status_pembayaran) {
        fields.push('status_pembayaran = ?');
        values.push(status_pembayaran);
    }

    if (metode_pembayaran) {
        fields.push('metode_pembayaran = ?');
        values.push(metode_pembayaran);
    }

    if (uang_diterima !== undefined) {
        fields.push('uang_diterima = ?');
        values.push(Number(uang_diterima) || 0);
    }

    if (uang_kembalian !== undefined) {
        fields.push('uang_kembalian = ?');
        values.push(Number(uang_kembalian) || 0);
    }

    if (fields.length === 0) {
        return fail(res, 400, 'Tidak ada status yang diperbarui.');
    }

    values.push(id);

    db.query(`UPDATE pesanan SET ${fields.join(', ')} WHERE id = ?`, values, (err, result) => {
        if (err) {
            console.error('Error update status:', err);
            return fail(res, 500, 'Gagal memperbarui status transaksi.');
        }

        if (result.affectedRows === 0) {
            return fail(res, 404, 'Pesanan tidak ditemukan.');
        }

        return res.json({
            status: 'SUKSES',
            pesan: 'Status berhasil diperbarui.',
            message: 'Status berhasil diperbarui.'
        });
    });
};
