'use strict';

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    console.error(' Error:', err.message);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        ok: false,
        error: err.message || 'Error interno del servidor'
    });
}

module.exports = errorMiddleware;

