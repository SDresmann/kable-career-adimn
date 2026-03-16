const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Issue a JWT for a user (e.g. after login).
 * Use a strong JWT_SECRET in production and set expiry.
 */
function signToken(userId) {
    return jwt.sign(
        { userId: String(userId) },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/**
 * Middleware: verify Authorization: Bearer <token> and attach req.userId.
 * Use on routes that require a logged-in user.
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (_) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { signToken, verifyToken, JWT_SECRET };
