'use strict';

const ValidationError = require('../exceptions/ValidationError');

function validateUpdateDoctor({ name, email, specialty }) {
    if (!name || !email || !specialty) {
        throw new ValidationError('name, email and specialty are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('Invalid email format');
    }
    if (name.trim().length < 3) {
        throw new ValidationError('Name must be at least 3 characters');
    }
    if (specialty.trim().length < 3) {
        throw new ValidationError('Specialty must be at least 3 characters');
    }
}

module.exports = { validateUpdateDoctor };