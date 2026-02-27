'use strict';

const authService = require('../services/authService');

async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            ok: true,
            message: 'User registered successfully',
            ...result
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.json({
            ok: true,
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        next(error);
    }
}

async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.json({ ok: true, ...result });
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        res.json({ ok: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        res.json({
            ok: true,
            user: req.user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, refresh, logout, me };