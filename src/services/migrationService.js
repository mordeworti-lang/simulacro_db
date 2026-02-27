'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/postgres');
const { getDb } = require('../config/mongodb');
const { CSV_PATH } = require('../config/env');

// ─── PARSER CSV MANUAL (sin dependencias extra) ───────────────────────────────
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, i) => row[h] = values[i]);
        return row;
    });
}

// ─── NORMALIZACIÓN DE DATOS ───────────────────────────────────────────────────
function normalizeEmail(email) {
    return email?.toLowerCase().trim();
}

function normalizeName(name) {
    return name?.trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

// ─── MIGRACIÓN PRINCIPAL ──────────────────────────────────────────────────────
async function runMigration({ clearBefore = false } = {}) {
    const csvPath = path.resolve(CSV_PATH);

    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV no encontrado en: ${csvPath}`);
    }

    const rows = parseCSV(csvPath);
    console.log(`CSV leído: ${rows.length} filas`);

    const pgClient = await pool.connect();

    try {
        // ── LIMPIAR SI SE PIDE ────────────────────────────────────────────────
        if (clearBefore) {
            console.log(' Limpiando datos anteriores...');
            await pgClient.query('BEGIN');
            await pgClient.query('DELETE FROM appointment');
            await pgClient.query('DELETE FROM insurance');
            await pgClient.query('DELETE FROM patient');
            await pgClient.query('DELETE FROM doctor');
            await pgClient.query('DELETE FROM users');
            await pgClient.query('COMMIT');

            const db = getDb();
            await db.collection('patient_histories').deleteMany({});
            console.log('Datos anteriores eliminados');
        }

        await pgClient.query('BEGIN');

        // ── 1. INSERTAR SEGUROS ───────────────────────────────────────────────
        const insuranceMap = {}; // name → id

        const uniqueInsurances = [...new Map(
            rows.map(r => [r.insurance_provider, {
                name: r.insurance_provider,
                coverage: parseFloat(r.coverage_percentage)
            }])
        ).values()];

        for (const ins of uniqueInsurances) {
            const result = await pgClient.query(
                `INSERT INTO insurance (name, coverage_percentage)
                 VALUES ($1, $2)
                 ON CONFLICT (name) DO UPDATE SET coverage_percentage = EXCLUDED.coverage_percentage
                 RETURNING id`,
                [ins.name, ins.coverage]
            );
            insuranceMap[ins.name] = result.rows[0].id;
        }
        console.log(`Seguros insertados: ${uniqueInsurances.length}`);

        // ── 2. INSERTAR DOCTORES ──────────────────────────────────────────────
        const doctorMap = {}; // email → { userId, doctorId }

        const uniqueDoctors = [...new Map(
            rows.map(r => [r.doctor_email, {
                name: normalizeName(r.doctor_name),
                email: normalizeEmail(r.doctor_email),
                specialty: r.specialty
            }])
        ).values()];

        for (const doc of uniqueDoctors) {
            // Crear usuario del doctor
            const userResult = await pgClient.query(
                `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, 'doctor')
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [doc.name, doc.email, 'migrated_no_password']
            );
            const userId = userResult.rows[0].id;

            // Crear perfil doctor
            const docResult = await pgClient.query(
                `INSERT INTO doctor (user_id, specialty)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id) DO UPDATE SET specialty = EXCLUDED.specialty
                 RETURNING id`,
                [userId, doc.specialty]
            );

            doctorMap[doc.email] = {
                userId,
                doctorId: docResult.rows[0].id,
                name: doc.name,
                specialty: doc.specialty
            };
        }
        console.log(`Doctores insertados: ${uniqueDoctors.length}`);

        // ── 3. INSERTAR PACIENTES ─────────────────────────────────────────────
        const patientMap = {}; // email → { userId, patientId }

        const uniquePatients = [...new Map(
            rows.map(r => [r.patient_email, {
                name: normalizeName(r.patient_name),
                email: normalizeEmail(r.patient_email),
                phone: r.patient_phone,
                address: r.patient_address
            }])
        ).values()];

        for (const pat of uniquePatients) {
            // Crear usuario del paciente
            const userResult = await pgClient.query(
                `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, 'patient')
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [pat.name, pat.email, 'migrated_no_password']
            );
            const userId = userResult.rows[0].id;

            // Crear perfil paciente
            const patResult = await pgClient.query(
                `INSERT INTO patient (user_id, phone, address)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
                 RETURNING id`,
                [userId, pat.phone, pat.address]
            );

            patientMap[pat.email] = {
                userId,
                patientId: patResult.rows[0].id,
                name: pat.name
            };
        }
        console.log(`Pacientes insertados: ${uniquePatients.length}`);

        // ── 4. INSERTAR CITAS ─────────────────────────────────────────────────
        let appointmentsInserted = 0;

        for (const row of rows) {
            const patientEmail = normalizeEmail(row.patient_email);
            const doctorEmail = normalizeEmail(row.doctor_email);

            const patient = patientMap[patientEmail];
            const doctor = doctorMap[doctorEmail];
            const insuranceId = insuranceMap[row.insurance_provider] || null;

            if (!patient || !doctor) {
                console.warn(`  Referencia inválida en cita ${row.appointment_id}`);
                continue;
            }

            await pgClient.query(
                `INSERT INTO appointment (
                    appointment_code, appointment_date, patient_id, doctor_id,
                    insurance_id, treatment_code, treatment_description,
                    treatment_cost, amount_paid
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                ON CONFLICT (appointment_code) DO NOTHING`,
                [
                    row.appointment_id,
                    row.appointment_date,
                    patient.patientId,
                    doctor.doctorId,
                    insuranceId,
                    row.treatment_code,
                    row.treatment_description,
                    parseFloat(row.treatment_cost),
                    parseFloat(row.amount_paid)
                ]
            );
            appointmentsInserted++;
        }
        console.log(`Citas insertadas: ${appointmentsInserted}`);

        await pgClient.query('COMMIT');

        // ── 5. INSERTAR HISTORIALES EN MONGODB ───────────────────────────────
        const db = getDb();
        const collection = db.collection('patient_histories');

        // Agrupar citas por paciente
        const historiesByPatient = {};

        for (const row of rows) {
            const email = normalizeEmail(row.patient_email);
            if (!historiesByPatient[email]) {
                historiesByPatient[email] = {
                    patientEmail: email,
                    patientName: normalizeName(row.patient_name),
                    appointments: []
                };
            }

            historiesByPatient[email].appointments.push({
                appointmentId: row.appointment_id,
                date: row.appointment_date,
                doctorName: normalizeName(row.doctor_name),
                doctorEmail: normalizeEmail(row.doctor_email),
                specialty: row.specialty,
                treatmentCode: row.treatment_code,
                treatmentDescription: row.treatment_description,
                treatmentCost: parseFloat(row.treatment_cost),
                insuranceProvider: row.insurance_provider,
                coveragePercentage: parseFloat(row.coverage_percentage),
                amountPaid: parseFloat(row.amount_paid)
            });
        }

        // Upsert cada historial en MongoDB
        let historiesInserted = 0;
        for (const history of Object.values(historiesByPatient)) {
            await collection.updateOne(
                { patientEmail: history.patientEmail },
                { $set: history },
                { upsert: true }
            );
            historiesInserted++;
        }

        // Índice en patientEmail para búsquedas rápidas
        await collection.createIndex({ patientEmail: 1 }, { unique: true });
        console.log(` Historiales MongoDB insertados: ${historiesInserted}`);

        return {
            patients: uniquePatients.length,
            doctors: uniqueDoctors.length,
            insurances: uniqueInsurances.length,
            appointments: appointmentsInserted,
            histories: historiesInserted,
            csvPath
        };

    } catch (error) {
        await pgClient.query('ROLLBACK');
        console.error(' Error en migración, rollback ejecutado');
        throw error;
    } finally {
        pgClient.release();
    }
}

module.exports = { runMigration };