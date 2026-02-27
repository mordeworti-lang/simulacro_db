'use strict';

const { pool } = require('../config/postgres');
const { getDb } = require('../config/mongodb');

async function findAll({ patientId, doctorId, date } = {}) {
    let query = `
        SELECT 
            a.id, a.appointment_code, a.appointment_date,
            u_p.name AS patient_name, u_p.email AS patient_email,
            u_d.name AS doctor_name, u_d.email AS doctor_email,
            d.specialty,
            a.treatment_code, a.treatment_description,
            a.treatment_cost, a.amount_paid,
            i.name AS insurance_name,
            i.coverage_percentage,
            a.created_at
        FROM appointment a
        INNER JOIN patient p ON p.id = a.patient_id
        INNER JOIN users u_p ON u_p.id = p.user_id
        INNER JOIN doctor d ON d.id = a.doctor_id
        INNER JOIN users u_d ON u_d.id = d.user_id
        LEFT JOIN insurance i ON i.id = a.insurance_id
    `;
    const params = [];
    const conditions = [];

    if (patientId) {
        conditions.push(`a.patient_id = $${params.length + 1}`);
        params.push(patientId);
    }
    if (doctorId) {
        conditions.push(`a.doctor_id = $${params.length + 1}`);
        params.push(doctorId);
    }
    if (date) {
        // Filtrar por dia sin importar la hora (appointment_date es TIMESTAMPTZ)
        conditions.push(`DATE(a.appointment_date) = $${params.length + 1}`);
        params.push(date);
    }
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY a.appointment_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
}

async function findById(id) {
    const result = await pool.query(
        `SELECT 
            a.id, a.appointment_code, a.appointment_date,
            u_p.name AS patient_name, u_p.email AS patient_email,
            u_d.name AS doctor_name, u_d.email AS doctor_email,
            d.specialty,
            a.treatment_code, a.treatment_description,
            a.treatment_cost, a.amount_paid,
            i.name AS insurance_name,
            i.coverage_percentage,
            a.created_at
        FROM appointment a
        INNER JOIN patient p ON p.id = a.patient_id
        INNER JOIN users u_p ON u_p.id = p.user_id
        INNER JOIN doctor d ON d.id = a.doctor_id
        INNER JOIN users u_d ON u_d.id = d.user_id
        LEFT JOIN insurance i ON i.id = a.insurance_id
        WHERE a.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function create({ appointmentCode, appointmentDate, patientId, doctorId, insuranceId, treatmentCode, treatmentDescription, treatmentCost, amountPaid }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en PostgreSQL
        const result = await client.query(
            `INSERT INTO appointment (
                appointment_code, appointment_date, patient_id, doctor_id,
                insurance_id, treatment_code, treatment_description,
                treatment_cost, amount_paid
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING id`,
            [appointmentCode, appointmentDate, patientId, doctorId,
             insuranceId, treatmentCode, treatmentDescription,
             treatmentCost, amountPaid]
        );

        const appointmentId = result.rows[0].id;
        await client.query('COMMIT');

        // Sincronizar con MongoDB
        await syncToMongo(appointmentId);

        return await findById(appointmentId);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Agrega la cita al historial del paciente en MongoDB
async function syncToMongo(appointmentId) {
    try {
        const appt = await findById(appointmentId);
        if (!appt) return;

        const db = getDb();
        await db.collection('patient_histories').updateOne(
            { patientEmail: appt.patient_email },
            {
                $setOnInsert: {
                    patientEmail: appt.patient_email,
                    patientName: appt.patient_name
                },
                $push: {
                    appointments: {
                        appointmentId: appt.appointment_code,
                        date: appt.appointment_date,
                        doctorName: appt.doctor_name,
                        doctorEmail: appt.doctor_email,
                        specialty: appt.specialty,
                        treatmentCode: appt.treatment_code,
                        treatmentDescription: appt.treatment_description,
                        treatmentCost: parseFloat(appt.treatment_cost),
                        insuranceProvider: appt.insurance_name || 'SinSeguro',
                        coveragePercentage: parseFloat(appt.coverage_percentage) || 0,
                        amountPaid: parseFloat(appt.amount_paid)
                    }
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.warn('No se pudo sincronizar cita a MongoDB:', err.message);
    }
}

module.exports = { findAll, findById, create };