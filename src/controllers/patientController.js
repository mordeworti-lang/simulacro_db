'use strict';

const patientService = require('../services/patientService');

async function getHistory(req, res, next) {
    try {
        const { email } = req.params;
        const result = await patientService.getPatientHistory(email);
        res.json({ ok: true, ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = { getHistory };