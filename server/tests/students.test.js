const request = require('supertest');
const app = require('../index');

describe('Students API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.com', password: 'password123' });
    adminToken = adminRes.body.token;

    // Login as student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@school.com', password: 'password123' });
    studentToken = studentRes.body.token;
  });

  describe('GET /api/students', () => {
    it('returns students list for admin', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.students)).toBe(true);
      expect(res.body.students.length).toBeGreaterThan(0);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });

    it('supports search by name', async () => {
      const res = await request(app)
        .get('/api/students?search=Aye')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.students.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/students', () => {
    it('creates a student (admin only)', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Student',
          email: `newstudent-${Date.now()}@test.com`,
          password: 'TestPass123',
          grade_id: 11,
          gender: 'male',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('student');
      expect(res.body.student).toHaveProperty('id');
      expect(res.body.student).toHaveProperty('student_id');
    });

    it('rejects student creation by student role', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Unauthorized',
          email: 'unauth@test.com',
          password: 'TestPass123',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/students/:id', () => {
    it('returns student details for admin', async () => {
      // First get a student from the list
      const list = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);
      const studentId = list.body.students[0].id;

      const res = await request(app)
        .get(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('student');
      expect(res.body.student).toHaveProperty('name');
      expect(res.body.student).toHaveProperty('email');
    });

    it('returns 404 for non-existent student', async () => {
      const res = await request(app)
        .get('/api/students/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
