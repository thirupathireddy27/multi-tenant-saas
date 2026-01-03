const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'super_secret_jwt_key';
        const decoded = jwt.verify(token, secret);

        // Attach user info to request
        req.user = decoded;
        // decoded should be { userId, tenantId, role }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole };
