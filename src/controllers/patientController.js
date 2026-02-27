'use strict';

const patientService = require('../services/patientService');
const { validatePatientEmail } = require('../validators/patientValidator');

async function getHistory(req, res, next) {
    try {
        const { email } = req.params;
        validatePatientEmail(email);
        const result = await patientService.getPatientHistory(email);
        res.json({ ok: true, ...result });
    } catch (error) {
        next(error);
    }
}

async function search(req, res, next) {
    try {
        const { q } = req.query;
        const result = await patientService.searchPatients(q || '');
        res.json({ ok: true, patients: result });
    } catch (error) {
        next(error);
    }
}

module.exports = { getHistory, search };
