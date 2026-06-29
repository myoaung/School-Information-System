const request = require('supertest');
const app = require('../index');

describe('AI Analytics API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/ai/stats', () => {
    it('returns analytics stats for admin', async () => {
      const res = await request(app)
        .get('/api/ai/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stats');
    });

    it('rejects student access', async () => {
      const res = await request(app)
        .get('/api/ai/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/ai/at-risk', () => {
    it('returns at-risk students for admin', async () => {
      const res = await request(app)
        .get('/api/ai/at-risk')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('students');
    });

    it('supports minScore filter', async () => {
      const res = await request(app)
        .get('/api/ai/at-risk?minScore=50')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/ai/student/:id', () => {
    it('returns student risk assessment', async () => {
      const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      const studentId = students.body.students[0]?.user_id || students.body.students[0]?.id;
      const res = await request(app)
        .get(`/api/ai/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/ai/alerts', () => {
    it('returns alerts for admin', async () => {
      const res = await request(app)
        .get('/api/ai/alerts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('alerts');
    });
  });
});
