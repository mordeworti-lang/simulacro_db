'use strict';

const { getDb } = require('../config/mongodb');

async function findHistoryByEmail(email) {
    const db = getDb();
    const history = await db.collection('patient_histories').findOne(
        { patientEmail: email.toLowerCase() }
    );
    return history || null;
}

module.exports = { findHistoryByEmail };