const request = require('supertest');
const app = require('../index');

describe('Courses API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/courses', () => {
    it('returns courses list', async () => {
      const res = await request(app).get('/api/courses').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.courses || res.body)).toBe(true);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('returns course details', async () => {
      const list = await request(app).get('/api/courses').set('Authorization', `Bearer ${adminToken}`);
      const courses = list.body.courses || list.body;
      if (courses.length > 0) {
        const res = await request(app).get(`/api/courses/${courses[0].id}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
    });
  });

  describe('POST /api/courses', () => {
    it('creates a course (admin)', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ class_id: 1, subject_id: 1, title: 'Test Course', description: 'Test' });
      expect(res.status).toBe(201);
    });

    it('rejects student creating course', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ class_id: 1, subject_id: 1, title: 'Unauthorized' });
      expect(res.status).toBe(403);
    });
  });
});
