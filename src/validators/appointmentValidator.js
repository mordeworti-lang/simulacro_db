'use strict';

const ValidationError = require('../exceptions/ValidationError');

/**
 * Valida los datos para crear una cita.
 * treatmentCode ya NO es requerido — se genera automáticamente si no se provee.
 * appointmentDate debe ser un datetime con hora, ej: "2025-03-15T10:00:00"
 */
function validateCreateAppointment({ patientId, doctorId, appointmentDate, treatmentDescription, treatmentCost, amountPaid }) {
    if (!patientId || !doctorId || !appointmentDate || !treatmentDescription) {
        throw new ValidationError('patientId, doctorId, appointmentDate y treatmentDescription son requeridos');
    }
    if (isNaN(Date.parse(appointmentDate))) {
        throw new ValidationError('Formato de appointmentDate invalido. Usa ISO 8601, ej: 2025-03-15T10:00:00');
    }
    if (treatmentCost !== undefined && Number(treatmentCost) < 0) {
        throw new ValidationError('treatmentCost debe ser >= 0');
    }
    if (amountPaid !== undefined && Number(amountPaid) < 0) {
        throw new ValidationError('amountPaid debe ser >= 0');
    }
}

module.exports = { validateCreateAppointment };
