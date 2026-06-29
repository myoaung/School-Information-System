const request = require('supertest');
const app = require('../index');

describe('Quizzes API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/quizzes', () => {
    it('returns quizzes list', async () => {
      const res = await request(app).get('/api/quizzes').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/quizzes', () => {
    it('creates a quiz (admin/teacher)', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course_id: 1, title: 'Test Quiz', description: 'Test', time_limit_minutes: 30, max_score: 50 });
      expect(res.status).toBe(201);
    });

    it('rejects student creating quiz', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: 1, title: 'Unauthorized' });
      expect(res.status).toBe(403);
    });
  });
});
