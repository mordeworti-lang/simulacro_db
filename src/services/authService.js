'use strict';

const userRepo = require('../repositories/userRepository');
const { pool } = require('../config/postgres');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { validateLogin, validateRegister } = require('../validators/authValidator');
const ValidationError = require('../exceptions/ValidationError');
const UnauthorizedError = require('../exceptions/UnauthorizedError');

async function login({ email, password }) {
    validateLogin({ email, password });

    const user = await userRepo.findByEmail(email.toLowerCase());
    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    // Usuarios migrados no pueden hacer login directamente
    if (user.password === 'migrated_no_password') {
        throw new UnauthorizedError('This account requires password setup. Contact an administrator.');
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await userRepo.saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
}

async function register({ name, email, password, role, specialty, phone, address }) {
    validateRegister({ name, email, password, role });

    if (role === 'doctor' && !specialty) {
        throw new ValidationError('specialty is required for doctor role');
    }

    const existing = await userRepo.findByEmail(email.toLowerCase());
    if (existing) {
        throw new ValidationError('Email already registered');
    }

    const hashed = await hashPassword(password);

    const client = await pool.connect();
    let user;
    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role, created_at`,
            [name.trim(), email.toLowerCase(), hashed, role]
        );
        user = userResult.rows[0];

        if (role === 'doctor') {
            await client.query(
                `INSERT INTO doctor (user_id, specialty) VALUES ($1, $2)`,
                [user.id, specialty.trim()]
            );
        } else if (role === 'patient') {
            await client.query(
                `INSERT INTO patient (user_id, phone, address) VALUES ($1, $2, $3)`,
                [user.id, phone ? phone.trim() : null, address ? address.trim() : null]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await userRepo.saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

    return { accessToken, refreshToken, user };
}

async function refreshToken(token) {
    if (!token) throw new UnauthorizedError('Refresh token required');

    const stored = await userRepo.findRefreshToken(token);
    if (!stored) throw new UnauthorizedError('Invalid or expired refresh token');

    try {
        verifyRefreshToken(token);
    } catch {
        await userRepo.deleteRefreshToken(token);
        throw new UnauthorizedError('Invalid refresh token');
    }

    const payload = { id: stored.user_id, email: stored.email, role: stored.role };
    const newAccessToken = generateAccessToken(payload);
    return { accessToken: newAccessToken };
}

async function logout(token) {
    if (token) await userRepo.deleteRefreshToken(token);
}

module.exports = { login, register, refreshToken, logout };
