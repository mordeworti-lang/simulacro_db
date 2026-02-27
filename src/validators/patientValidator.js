'use strict';

const ValidationError = require('../exceptions/ValidationError');

function validatePatientEmail(email) {
    if (!email) {
        throw new ValidationError('Email is required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('Invalid email format');
    }
}

module.exports = { validatePatientEmail };