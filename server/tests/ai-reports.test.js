const request = require('supertest');
const app = require('../index');

describe('AI Reports API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('POST /api/ai/report/:studentId', () => {
    it('generates an AI report for a student', async () => {
      const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      const studentId = students.body.students[0]?.user_id || students.body.students[0]?.id;
      const res = await request(app)
        .post(`/api/ai/report/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 201]).toContain(res.status);
    });

    it('rejects student generating report', async () => {
      const res = await request(app)
        .post('/api/ai/report/1')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/ai/reports', () => {
    it('returns all reports for admin', async () => {
      const res = await request(app)
        .get('/api/ai/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      // Response may be array or object with reports property
      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/ai/report/:studentId', () => {
    it('returns reports for a student', async () => {
      const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      const studentId = students.body.students[0]?.user_id || students.body.students[0]?.id;
      const res = await request(app)
        .get(`/api/ai/report/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
