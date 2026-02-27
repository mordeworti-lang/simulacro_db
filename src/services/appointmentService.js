'use strict';

const appointmentRepo = require('../repositories/appointmentRepository');
const { pool } = require('../config/postgres');
const NotFoundError = require('../exceptions/NotFoundError');
const ValidationError = require('../exceptions/ValidationError');
const { validateCreateAppointment } = require('../validators/appointmentValidator');

async function getAllAppointments({ patientId, doctorId } = {}) {
    return await appointmentRepo.findAll({ patientId, doctorId });
}

async function getAppointmentById(id) {
    const appointment = await appointmentRepo.findById(id);
    if (!appointment) throw new NotFoundError('Appointment not found');
    return appointment;
}

async function createAppointment(data) {
    const {
        patientId, doctorId, appointmentDate, insuranceId,
        treatmentDescription, treatmentCost, amountPaid
    } = data;

    // treatmentCode ya no se pide al cliente — se genera automáticamente
    let { treatmentCode } = data;
    if (!treatmentCode) {
        treatmentCode = `TRT-${Date.now()}`;
    }

    validateCreateAppointment(data);

    // ── Verificar existencia de paciente y doctor ──────────────────────────
    const patientCheck = await pool.query('SELECT id FROM patient WHERE id = $1', [patientId]);
    if (!patientCheck.rows[0]) throw new NotFoundError('Paciente no encontrado');

    const doctorCheck = await pool.query('SELECT id FROM doctor WHERE id = $1', [doctorId]);
    if (!doctorCheck.rows[0]) throw new NotFoundError('Doctor no encontrado');

    // ── Calcular bloque de 30 minutos de la nueva cita ────────────────────
    const startTime = new Date(appointmentDate);
    const endTime   = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 min

    // ── Validación 1: el doctor no puede tener otra cita en ese bloque ─────
    const doctorConflict = await pool.query(
        `SELECT id FROM appointment
         WHERE doctor_id = $1
           AND appointment_date < $3
           AND appointment_date + INTERVAL '30 minutes' > $2`,
        [doctorId, startTime.toISOString(), endTime.toISOString()]
    );
    if (doctorConflict.rows.length > 0) {
        throw new ValidationError(
            'El doctor ya tiene una cita en ese horario. Cada cita ocupa 30 minutos, elige otro horario.'
        );
    }

    // ── Validación 2: el mismo paciente no puede tener dos citas el mismo día y hora ──
    const patientConflict = await pool.query(
        `SELECT id FROM appointment
         WHERE patient_id = $1
           AND appointment_date = $2`,
        [patientId, startTime.toISOString()]
    );
    if (patientConflict.rows.length > 0) {
        throw new ValidationError(
            'Ya tienes una cita programada para ese mismo dia y hora. No puedes reservar dos citas al mismo tiempo.'
        );
    }

    // ── Crear la cita ──────────────────────────────────────────────────────
    const appointmentCode = `APT-${Date.now()}`;
    return await appointmentRepo.create({
        appointmentCode,
        appointmentDate: startTime.toISOString(),
        patientId,
        doctorId,
        insuranceId: insuranceId || null,
        treatmentCode,
        treatmentDescription,
        treatmentCost:  treatmentCost  ?? 0,
        amountPaid:     amountPaid     ?? 0
    });
}

// Devuelve las citas según el rol del usuario autenticado
async function getMyAppointments({ userId, role, date, today }) {
    if (role === 'patient') {
        const pr = await pool.query('SELECT id FROM patient WHERE user_id = $1', [userId]);
        if (!pr.rows[0]) return [];
        return await appointmentRepo.findAll({ patientId: pr.rows[0].id });
    }

    if (role === 'doctor') {
        const dr = await pool.query('SELECT id FROM doctor WHERE user_id = $1', [userId]);
        if (!dr.rows[0]) return [];
        const doctorId = dr.rows[0].id;

        const filterDate = today
            ? new Date().toISOString().slice(0, 10)
            : date || null;

        return await appointmentRepo.findAll({ doctorId, date: filterDate });
    }

    // admin: todas
    return await appointmentRepo.findAll({});
}

module.exports = { getAllAppointments, getAppointmentById, createAppointment, getMyAppointments };
