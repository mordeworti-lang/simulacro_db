'use strict';

const AppError = require('../exceptions/AppError');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    // Error conocido de la aplicación
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            ok: false,
            error: err.message
        });
    }

    // Error de PostgreSQL - email duplicado
    if (err.code === '23505') {
        return res.status(400).json({
            ok: false,
            error: 'A record with that value already exists'
        });
    }

    // Error de PostgreSQL - foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({
            ok: false,
            error: 'Referenced record does not exist'
        });
    }

    // Error no esperado
    console.error(' Unexpected error:', err);
    res.status(500).json({
        ok: false,
        error: 'Internal server error'
    });
}

module.exports = errorMiddleware; 