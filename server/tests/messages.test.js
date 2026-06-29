const request = require('supertest');
const app = require('../index');

describe('Messages API', () => {
  let token;
  let otherToken;

  beforeAll(async () => {
    const user = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    token = user.body.token;
    const other = await request(app).post('/api/auth/login').send({ email: 'teacher@school.com', password: 'password123' });
    otherToken = other.body.token;
  });

  describe('POST /api/messages', () => {
    it('sends a message', async () => {
      const users = await request(app).get('/api/messages/users').set('Authorization', `Bearer ${token}`);
      const receiverId = users.body.find(u => u.role === 'teacher')?.id;
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ receiver_id: receiverId, subject: 'Test', body: 'Hello' });
      expect(res.status).toBe(201);
    });

    it('rejects empty body', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ receiver_id: 1, body: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/messages/inbox', () => {
    it('returns inbox', async () => {
      const res = await request(app).get('/api/messages/inbox').set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/messages/sent', () => {
    it('returns sent messages', async () => {
      const res = await request(app).get('/api/messages/sent').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/messages/unread-count', () => {
    it('returns unread count', async () => {
      const res = await request(app).get('/api/messages/unread-count').set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
    });
  });
});
