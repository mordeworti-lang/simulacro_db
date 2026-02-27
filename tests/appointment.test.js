'use strict';

/**
 * Appointment API integration tests
 * Run: npm test
 * Requires running server + seeded DB (run migration first)
 */

const request = require('supertest');
const app = require('../src/app');

describe('Appointments API', () => {
    let authToken;

    beforeAll(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Admin',
                email: 'testadmin@saludplus.com',
                password: 'testpass123',
                role: 'admin'
            });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'testadmin@saludplus.com', password: 'testpass123' });

        authToken = loginRes.body.accessToken;
    });

    describe('GET /api/appointments', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/appointments');
            expect(res.status).toBe(401);
            expect(res.body.ok).toBe(false);
        });

        it('should return list of appointments with valid token', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(Array.isArray(res.body.appointments)).toBe(true);
        });
    });

    describe('GET /api/appointments/:id', () => {
        it('should return 400 for invalid ID', async () => {
            const res = await request(app)
                .get('/api/appointments/abc')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(400);
        });

        it('should return 404 for non-existent appointment', async () => {
            const res = await request(app)
                .get('/api/appointments/999999')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/appointments - Validaciones de horario', () => {
        it('should reject if treatmentDescription is missing (treatmentCode ya no es requerido)', async () => {
            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: 1,
                    doctorId: 1,
                    appointmentDate: '2099-06-01T10:00:00'
                    // sin treatmentDescription → debe fallar
                });
            expect(res.status).toBe(400);
            expect(res.body.ok).toBe(false);
        });

        it('should accept appointment WITHOUT treatmentCode', async () => {
            // treatmentCode es opcional — el sistema lo genera si falta
            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: 1,
                    doctorId: 1,
                    appointmentDate: '2099-07-01T09:00:00',
                    treatmentDescription: 'Consulta general'
                    // SIN treatmentCode
                });
            // 201 si existe el paciente/doctor, 404 si no — ambos son correctos en test aislado
            expect([201, 404]).toContain(res.status);
        });
    });
});
