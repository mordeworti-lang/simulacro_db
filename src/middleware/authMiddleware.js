'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const UnauthorizedError = require('../exceptions/UnauthorizedError');

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        req.user = decoded; // { id, email, role }
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Invalid token'));
        }
        next(error);
    }
}

module.exports = authMiddleware;