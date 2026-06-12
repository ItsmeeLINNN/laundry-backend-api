const { verifyToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            status: 'GAGAL',
            message: 'Token autentikasi wajib dikirim.'
        });
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'GAGAL',
            message: error.message || 'Token autentikasi tidak valid.'
        });
    }
}

function requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.jabatan)) {
            return res.status(403).json({
                status: 'GAGAL',
                message: 'Akses ditolak untuk jabatan ini.'
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};
