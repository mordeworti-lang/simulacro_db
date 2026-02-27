'use strict';

const UnauthorizedError = require('../exceptions/UnauthorizedError');

function roleMiddleware(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Not authenticated'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new UnauthorizedError(
                `Access denied. Required roles: ${allowedRoles.join(', ')}`
            ));
        }

        next();
    };
}

module.exports = roleMiddleware;