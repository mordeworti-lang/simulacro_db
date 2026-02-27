'use strict';

const ValidationError = require('../exceptions/ValidationError');

function validateLogin({ email, password }) {
    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('Invalid email format');
    }
    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
    }
}

function validateRegister({ name, email, password, role }) {
    if (!name || !email || !password || !role) {
        throw new ValidationError('name, email, password and role are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('Invalid email format');
    }
    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
    }
    if (!['admin', 'doctor', 'patient'].includes(role)) {
        throw new ValidationError('Role must be admin, doctor or patient');
    }
}

module.exports = { validateLogin, validateRegister };