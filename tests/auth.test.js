'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
    const testUser = {
        name: 'Auth Test User',
        email: `authtest_${Date.now()}@saludplus.com`,
        password: 'securepass123',
        role: 'patient'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user and return tokens', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.accessToken).toBeDefined();
            expect(res.body.refreshToken).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should return 400 if email already registered', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(400);
            expect(res.body.ok).toBe(false);
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'not-an-email' });
            expect(res.status).toBe(400);
        });

        it('should return 400 for password shorter than 6 chars', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'new@mail.com', password: '123' });
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.accessToken).toBeDefined();
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'wrongpassword' });
            expect(res.status).toBe(401);
        });

        it('should return 401 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'ghost@mail.com', password: 'doesnotmatter' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info with valid token', async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });
    });
});
