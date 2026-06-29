const request = require('supertest');
const app = require('../index');

describe('Finance API', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/finance/fees', () => {
    it('returns fee structures', async () => {
      const res = await request(app).get('/api/finance/fees').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/finance/invoices', () => {
    it('returns invoices for admin', async () => {
      const res = await request(app).get('/api/finance/invoices').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns own invoices for student', async () => {
      const res = await request(app).get('/api/finance/invoices').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/finance/overview', () => {
    it('returns overview for admin', async () => {
      const res = await request(app).get('/api/finance/overview').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalInvoiced');
      expect(res.body).toHaveProperty('totalPaid');
    });

    it('rejects student access', async () => {
      const res = await request(app).get('/api/finance/overview').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/finance/invoices', () => {
    it('creates an invoice (admin)', async () => {
      const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      const studentId = students.body.students[0]?.user_id || students.body.students[0]?.id;
      const res = await request(app)
        .post('/api/finance/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: studentId, amount: 100000, due_date: '2026-12-31' });
      expect(res.status).toBe(201);
    });

    it('rejects invalid amount', async () => {
      const res = await request(app)
        .post('/api/finance/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: 1, amount: -100 });
      expect(res.status).toBe(400);
    });
  });
});
