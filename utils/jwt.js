const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'spincycle-dev-secret-change-me';
const DEFAULT_EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 12);

function base64UrlEncode(input) {
    return Buffer.from(JSON.stringify(input))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(input) {
    const base64 = String(input).replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function signPayload(payload, expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds
    };

    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(unsignedToken)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${unsignedToken}.${signature}`;
}

function verifyToken(token) {
    const parts = String(token || '').split('.');

    if (parts.length !== 3) {
        throw new Error('Token tidak valid.');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new Error('Signature token tidak valid.');
    }

    const decoded = base64UrlDecode(payload);

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token sudah kedaluwarsa.');
    }

    return decoded;
}

module.exports = {
    signPayload,
    verifyToken
};
