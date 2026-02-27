'use strict';

class CreateAppointmentDTO {
    constructor({ patientId, doctorId, appointmentDate, insuranceId, treatmentCode, treatmentDescription, treatmentCost, amountPaid }) {
        this.patientId = parseInt(patientId);
        this.doctorId = parseInt(doctorId);
        this.appointmentDate = appointmentDate?.trim();
        this.insuranceId = insuranceId ? parseInt(insuranceId) : null;
        this.treatmentCode = treatmentCode?.trim();
        this.treatmentDescription = treatmentDescription?.trim();
        this.treatmentCost = parseFloat(treatmentCost) || 0;
        this.amountPaid = parseFloat(amountPaid) || 0;
    }
}

module.exports = CreateAppointmentDTO;