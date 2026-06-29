const request = require('supertest');
const app = require('../index');

describe('Assignments API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/assignments', () => {
    it('returns assignments list', async () => {
      const res = await request(app).get('/api/assignments').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/assignments', () => {
    it('creates an assignment (admin/teacher)', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course_id: 1, title: 'Test Assignment', description: 'Test', due_date: '2026-12-31', max_score: 100 });
      expect(res.status).toBe(201);
    });

    it('rejects student creating assignment', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: 1, title: 'Unauthorized' });
      expect(res.status).toBe(403);
    });
  });
});
