'use strict';

const doctorRepo = require('../repositories/doctorRepository');
const { getDb } = require('../config/mongodb');

async function getAllDoctors({ specialty } = {}) {
    return await doctorRepo.findAll({ specialty });
}

async function getDoctorById(id) {
    const doctor = await doctorRepo.findById(id);
    if (!doctor) {
        const error = new Error('Doctor not found');
        error.statusCode = 404;
        throw error;
    }
    return doctor;
}

async function updateDoctor(id, data) {
    const { name, email, specialty } = data;

    if (!name || !email || !specialty) {
        const error = new Error('name, email and specialty are required');
        error.statusCode = 400;
        throw error;
    }

    const existing = await doctorRepo.findById(id);
    if (!existing) {
        const error = new Error('Doctor not found');
        error.statusCode = 404;
        throw error;
    }

    const emailTaken = await doctorRepo.emailExistsForOther(
        email.toLowerCase(),
        existing.user_id
    );
    if (emailTaken) {
        const error = new Error('Email already in use');
        error.statusCode = 400;
        throw error;
    }

    const updated = await doctorRepo.updateById(id, {
        name,
        email: email.toLowerCase(),
        specialty
    });

    await propagateToMongo(existing.email, updated);

    return updated;
}

async function propagateToMongo(oldEmail, updatedDoctor) {
    try {
        const db = getDb();
        await db.collection('patient_histories').updateMany(
            { 'appointments.doctorEmail': oldEmail },
            {
                $set: {
                    'appointments.$[apt].doctorName': updatedDoctor.name,
                    'appointments.$[apt].doctorEmail': updatedDoctor.email
                }
            },
            {
                arrayFilters: [{ 'apt.doctorEmail': oldEmail }]
            }
        );
    } catch (err) {
        console.warn('No se pudo propagar cambios a MongoDB:', err.message);
    }
}

module.exports = { getAllDoctors, getDoctorById, updateDoctor };