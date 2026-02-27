'use strict';

const appointmentService = require('../services/appointmentService');

async function getAll(req, res, next) {
    try {
        const { patientId, doctorId } = req.query;
        const appointments = await appointmentService.getAllAppointments({
            patientId: patientId ? parseInt(patientId) : undefined,
            doctorId: doctorId ? parseInt(doctorId) : undefined
        });
        res.json({ ok: true, appointments });
    } catch (error) { next(error); }
}

async function getById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ ok: false, error: 'Invalid ID' });
        const appointment = await appointmentService.getAppointmentById(id);
        res.json({ ok: true, appointment });
    } catch (error) { next(error); }
}

async function create(req, res, next) {
    try {
        const appointment = await appointmentService.createAppointment(req.body);
        res.status(201).json({ ok: true, message: 'Appointment created successfully', appointment });
    } catch (error) { next(error); }
}

// GET /api/appointments/mine
// Patient → returns their own appointments (via user_id lookup)
// Doctor  → returns their appointments, optionally filtered by ?date=YYYY-MM-DD or ?today=1
async function mine(req, res, next) {
    try {
        const { id: userId, role } = req.user;
        const { date, today } = req.query;

        const appointments = await appointmentService.getMyAppointments({
            userId, role, date, today: today === '1' || today === 'true'
        });
        res.json({ ok: true, appointments });
    } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, mine };
