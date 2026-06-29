const request = require('supertest');
const app = require('../index');

describe('Notifications API', () => {
  let token;

  beforeAll(async () => {
    const user = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    token = user.body.token;
  });

  describe('GET /api/notifications', () => {
    it('returns notifications', async () => {
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns unread count', async () => {
      const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('marks all as read', async () => {
      const res = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
