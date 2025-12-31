
import request from 'supertest';
import app from '../app';
import { dataStore } from '../lib/databaseService';
import pool from '../lib/database';

describe('Authentication API Integration Tests', () => {
    // Increase timeout for DB operations
    jest.setTimeout(30000);

    beforeAll(async () => {
        // Optional: Ensure DB connection is ready or run migrations if needed
    });

    afterAll(async () => {
        // Close database connection to prevent Jest from hanging
        await pool.end();
    });

    describe('POST /api/auth/register', () => {
        const randomSuffix = Math.floor(Math.random() * 100000);
        const validUser = {
            username: `testuser_${randomSuffix}`,
            email: `test_${randomSuffix}@example.com`,
            password: 'password123'
        };

        it('should register a new user successfully (201)', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe(validUser.email);
        });

        it('should fail when required fields are missing (400)', async () => {
            const invalidUser = {
                username: 'missing_password_user'
                // email and password missing
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });
    });

    describe('POST /api/auth/login', () => {
        const randomSuffix = Math.floor(Math.random() * 100000);
        const loginUser = {
            username: `loginuser_${randomSuffix}`,
            email: `login_${randomSuffix}@example.com`,
            password: 'password123'
        };

        beforeAll(async () => {
            // Create user directly in DB or via API to ensure existence
            await request(app)
                .post('/api/auth/register')
                .send(loginUser);
        });

        it('should login successfully with valid credentials (200)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUser.email,
                    password: loginUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail login with invalid password (401)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
    });
});
