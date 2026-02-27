'use strict';

const { getDb } = require('../config/mongodb');
const { pool } = require('../config/postgres');

async function findHistoryByEmail(email) {
    const db = getDb();
    const history = await db.collection('patient_histories').findOne(
        { patientEmail: email.toLowerCase() }
    );
    return history || null;
}

async function search(q) {
    const term = (q || '').trim();
    const result = await pool.query(
        `SELECT p.id, u.name, u.email, p.phone, p.address
         FROM patient p
         JOIN users u ON u.id = p.user_id
         WHERE u.name ILIKE $1 OR u.email ILIKE $1
         ORDER BY u.name ASC
         LIMIT 30`,
        [`%${term}%`]
    );
    return result.rows;
}

module.exports = { findHistoryByEmail, search };
