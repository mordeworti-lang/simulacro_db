'use strict';

const AppError = require('./AppError');

class ValidationError extends AppError {
    constructor(message = 'Validation error') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

module.exports = ValidationError;