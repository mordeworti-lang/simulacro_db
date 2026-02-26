'use strict';

const patientRepo = require('../repositories/patientRepository');

async function getPatientHistory(email) {
    if (!email) {
        const error = new Error('Email is required');
        error.statusCode = 400;
        throw error;
    }

    const history = await patientRepo.findHistoryByEmail(email);

    if (!history) {
        const error = new Error('Patient not found');
        error.statusCode = 404;
        throw error;
    }

    // Calcular estadísticas
    const appointments = history.appointments || [];
    const totalSpent = appointments.reduce((sum, a) => sum + a.amountPaid, 0);

    // Especialidad más frecuente
    const specialtyCount = {};
    appointments.forEach(a => {
        specialtyCount[a.specialty] = (specialtyCount[a.specialty] || 0) + 1;
    });
    const mostFrequentSpecialty = Object.entries(specialtyCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
        patient: {
            email: history.patientEmail,
            name: history.patientName
        },
        appointments,
        summary: {
            totalAppointments: appointments.length,
            totalSpent,
            mostFrequentSpecialty
        }
    };
}

module.exports = { getPatientHistory };