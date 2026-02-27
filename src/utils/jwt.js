'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config/env');

function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};