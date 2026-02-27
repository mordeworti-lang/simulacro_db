'use strict';

function success(res, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
        ok: true,
        ...data
    });
}

function error(res, message = 'Internal server error', statusCode = 500) {
    return res.status(statusCode).json({
        ok: false,
        error: message
    });
}

module.exports = { success, error };