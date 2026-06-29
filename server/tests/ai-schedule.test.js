const request = require('supertest');
const app = require('../index');

describe('AI Schedule API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/ai/constraints', () => {
    it('returns scheduling constraints for admin', async () => {
      const res = await request(app)
        .get('/api/ai/constraints')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('rejects student access', async () => {
      const res = await request(app)
        .get('/api/ai/constraints')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/ai/conflicts', () => {
    it('returns scheduling conflicts', async () => {
      const res = await request(app)
        .get('/api/ai/conflicts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/ai/generate', () => {
    it('rejects without class_id', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('generates schedule for a class', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ class_id: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('schedule');
    });
  });
});
