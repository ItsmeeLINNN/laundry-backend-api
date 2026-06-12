function ok(res, data = null, message = 'Berhasil.', statusCode = 200) {
    return res.status(statusCode).json({
        status: 'SUKSES',
        message,
        data
    });
}

function fail(res, message = 'Permintaan tidak valid.', statusCode = 400, details = null) {
    const payload = {
        status: statusCode >= 500 ? 'ERROR' : 'GAGAL',
        message,
        pesan: message
    };

    if (details) {
        payload.details = details;
    }

    return res.status(statusCode).json(payload);
}

module.exports = {
    ok,
    fail
};
