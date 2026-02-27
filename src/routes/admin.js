'use strict';

const { Router } = require('express');
const { pool } = require('../config/postgres');
const { hashPassword } = require('../utils/hash');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = Router();

/**
 * POST /api/admin/rehash-migrated
 * Re-asigna contraseña "saludplus123" a todos los usuarios migrados.
 * Requiere rol admin.
 */
router.post('/rehash-migrated', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
    try {
        const DEFAULT_PASSWORD = 'saludplus123';
        const hashed = await hashPassword(DEFAULT_PASSWORD);

        const result = await pool.query(
            `UPDATE users
             SET password = $1
             WHERE password = 'migrated_no_password'
             RETURNING id, name, email, role`,
            [hashed]
        );

        res.json({
            ok: true,
            message: `${result.rows.length} usuarios actualizados con contraseña "${DEFAULT_PASSWORD}"`,
            users: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/form-data
 * Devuelve listas de doctors, patients e insurances para poblar formularios.
 */
router.get('/form-data', authMiddleware, async (req, res, next) => {
    try {
        const [doctors, patients, insurances] = await Promise.all([
            pool.query(`SELECT d.id, u.name, u.email, d.specialty
                        FROM doctor d JOIN users u ON u.id = d.user_id
                        ORDER BY u.name ASC`),
            pool.query(`SELECT p.id, u.name, u.email, p.phone, p.address
                        FROM patient p JOIN users u ON u.id = p.user_id
                        ORDER BY u.name ASC`),
            pool.query(`SELECT id, name, coverage_percentage FROM insurance ORDER BY name ASC`)
        ]);

        res.json({
            ok: true,
            doctors: doctors.rows,
            patients: patients.rows,
            insurances: insurances.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

/**
 * POST /api/admin/history-event
 * Doctor adds a diagnosis/event to a patient's MongoDB history.
 * Requires auth (doctor or admin).
 */
router.post('/history-event', authMiddleware, async (req, res, next) => {
    try {
        const { patientEmail, eventType, eventDate, title, notes, prescription, relatedAppointmentId } = req.body;

        if (!patientEmail || !eventType || !eventDate || !title || !notes) {
            return res.status(400).json({ ok: false, error: 'patientEmail, eventType, eventDate, title and notes are required' });
        }

        const { getDb } = require('../config/mongodb');
        const db = getDb();

        const event = {
            eventId: `EVT-${Date.now()}`,
            eventType,
            date: eventDate,
            title: title.trim(),
            notes: notes.trim(),
            prescription: prescription ? prescription.trim() : null,
            relatedAppointmentId: relatedAppointmentId || null,
            addedBy: req.user.email,
            addedAt: new Date().toISOString()
        };

        const result = await db.collection('patient_histories').updateOne(
            { patientEmail: patientEmail.toLowerCase() },
            {
                $setOnInsert: { patientEmail: patientEmail.toLowerCase() },
                $push: { events: event }
            },
            { upsert: true }
        );

        res.status(201).json({ ok: true, message: 'Event added to history', event });
    } catch (error) {
        next(error);
    }
});
