'use strict';

const { pool } = require('../config/postgres');

async function findByEmail(email) {
    const result = await pool.query(
        `SELECT id, name, email, password, role, created_at
         FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
}

async function findById(id) {
    const result = await pool.query(
        `SELECT id, name, email, role, created_at
         FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function create({ name, email, password, role }) {
    const result = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, password, role]
    );
    return result.rows[0];
}

async function saveRefreshToken({ userId, token, expiresAt }) {
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expiresAt]
    );
}

async function findRefreshToken(token) {
    const result = await pool.query(
        `SELECT rt.*, u.id as user_id, u.email, u.role
         FROM refresh_tokens rt
         INNER JOIN users u ON u.id = rt.user_id
         WHERE rt.token = $1 AND rt.expires_at > NOW()`,
        [token]
    );
    return result.rows[0] || null;
}

async function deleteRefreshToken(token) {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE token = $1`,
        [token]
    );
}

async function deleteAllRefreshTokens(userId) {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE user_id = $1`,
        [userId]
    );
}

module.exports = {
    findByEmail,
    findById,
    create,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    deleteAllRefreshTokens
};