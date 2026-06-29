const request = require('supertest');
const app = require('../index');

describe('Auth API', () => {
  let token;
  const ts = Date.now();

  describe('POST /api/auth/register', () => {

    it('registers a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `student-${ts}@example.com`, password: 'TestPass123', name: 'Test Student' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('student');
    });

    it('registers a parent', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `parent-${ts}@example.com`, password: 'TestPass123', name: 'Test Parent', role: 'parent' });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('parent');
    });

    it('rejects duplicate email', async () => {
      // Register once
      await request(app)
        .post('/api/auth/register')
        .send({ email: `dup-${ts}@example.com`, password: 'TestPass123', name: 'First' });
      // Try again
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `dup-${ts}@example.com`, password: 'TestPass123', name: 'Duplicate' });
      expect(res.status).toBe(409);
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'weak@example.com', password: '123', name: 'Weak Pass' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'TestPass123', name: 'Bad Email' });
      expect(res.status).toBe(400);
    });

    it('rejects empty name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'noname@example.com', password: 'TestPass123', name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `student-${ts}@example.com`, password: 'TestPass123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `student-${ts}@example.com`, password: 'WrongPass123' });
      expect(res.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'TestPass123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(`student-${ts}@example.com`);
    });

    it('rejects missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });
});
