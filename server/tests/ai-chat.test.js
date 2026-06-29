const request = require('supertest');
const app = require('../index');

describe('AI Chat API', () => {
  let studentToken;
  let adminToken;

  beforeAll(async () => {
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@school.com', password: 'password123' });
    adminToken = admin.body.token;
  });

  describe('POST /api/chat', () => {
    it('sends a message and gets a reply', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Hello' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body.reply.length).toBeGreaterThan(0);
    });

    it('rejects empty message without file', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: '' });
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('truncates very long messages', async () => {
      const longMsg = 'a'.repeat(5000);
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: longMsg });
      expect(res.status).toBe(200);
      // Message should be truncated in the saved record
      expect(res.body.message.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('GET /api/chat/history', () => {
    it('returns chat history', async () => {
      const res = await request(app)
        .get('/api/chat/history')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const res = await request(app)
        .get('/api/chat/history?limit=2')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/chat/logs', () => {
    it('returns chat logs for admin', async () => {
      const res = await request(app)
        .get('/api/chat/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(res.body).toHaveProperty('total');
    });

    it('rejects non-admin access', async () => {
      const res = await request(app)
        .get('/api/chat/logs')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });
});
