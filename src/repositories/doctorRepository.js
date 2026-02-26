'use strict';

const { pool } = require('../config/postgres');

async function findAll({ specialty } = {}) {
    let query = `
        SELECT d.id, u.name, u.email, d.specialty, d.created_at
        FROM doctor d
        INNER JOIN users u ON u.id = d.user_id
    `;
    const params = [];

    if (specialty) {
        query += ` WHERE d.specialty ILIKE $1`;
        params.push(`%${specialty}%`);
    }

    query += ` ORDER BY u.name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
}

async function findById(id) {
    const result = await pool.query(
        `SELECT d.id, u.id as user_id, u.name, u.email, d.specialty, d.created_at, d.updated_at
         FROM doctor d
         INNER JOIN users u ON u.id = d.user_id
         WHERE d.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function updateById(id, { name, email, specialty }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const docResult = await client.query(
            `SELECT user_id FROM doctor WHERE id = $1`,
            [id]
        );

        if (!docResult.rows[0]) return null;
        const userId = docResult.rows[0].user_id;

        await client.query(
            `UPDATE users SET name = $1, email = $2 WHERE id = $3`,
            [name, email, userId]
        );

        await client.query(
            `UPDATE doctor SET specialty = $1, updated_at = NOW() WHERE id = $2`,
            [specialty, id]
        );

        await client.query('COMMIT');

        return await findById(id);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function emailExistsForOther(email, excludeUserId) {
    const result = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email, excludeUserId]
    );
    return result.rows.length > 0;
}

module.exports = { findAll, findById, updateById, emailExistsForOther };