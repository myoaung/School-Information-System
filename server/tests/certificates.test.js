const request = require('supertest');
const app = require('../index');

describe('Certificates API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/certificates', () => {
    it('returns certificates list', async () => {
      const res = await request(app).get('/api/certificates').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/certificates/generate', () => {
    it('generates a certificate (admin)', async () => {
      const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      const studentId = students.body.students[0]?.user_id || students.body.students[0]?.id;
      const res = await request(app)
        .post('/api/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: studentId, type: 'completion', data: { description: 'Completed Grade 10' } });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('serial_number');
    });

    it('rejects invalid type', async () => {
      const res = await request(app)
        .post('/api/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: 1, type: 'invalid' });
      expect(res.status).toBe(400);
    });
  });
});
