'use strict';

const doctorService = require('../services/doctorService');
const { validateUpdateDoctor } = require('../validators/doctorValidator');

async function getAll(req, res, next) {
    try {
        const { specialty } = req.query;
        const doctors = await doctorService.getAllDoctors({ specialty });
        res.json({ ok: true, doctors });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ ok: false, error: 'Invalid ID' });
        }
        const doctor = await doctorService.getDoctorById(id);
        res.json({ ok: true, doctor });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ ok: false, error: 'Invalid ID' });
        }
        // Validate input early, before hitting the service layer
        validateUpdateDoctor(req.body);
        const doctor = await doctorService.updateDoctor(id, req.body);
        res.json({ ok: true, message: 'Doctor updated successfully', doctor });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getById, update };
