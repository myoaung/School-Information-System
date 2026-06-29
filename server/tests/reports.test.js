const request = require('supertest');
const app = require('../index');

describe('Reports API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/reports/dashboard', () => {
    it('returns admin dashboard stats', async () => {
      const res = await request(app).get('/api/reports/dashboard').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dashboard');
    });

    it('returns student dashboard stats', async () => {
      const res = await request(app).get('/api/reports/dashboard').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dashboard');
    });
  });

  describe('GET /api/reports/overview', () => {
    it('returns school overview for admin', async () => {
      const res = await request(app).get('/api/reports/overview').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
