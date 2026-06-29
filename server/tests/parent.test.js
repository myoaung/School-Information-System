const request = require('supertest');
const app = require('../index');

describe('Parent Portal API', () => {
  let parentToken;
  let studentToken;

  beforeAll(async () => {
    const parent = await request(app).post('/api/auth/login').send({ email: 'parent@school.com', password: 'password123' });
    parentToken = parent.body.token;
    const student = await request(app).post('/api/auth/login').send({ email: 'student@school.com', password: 'password123' });
    studentToken = student.body.token;
  });

  describe('GET /api/parent/children', () => {
    it('returns linked children for parent', async () => {
      const res = await request(app).get('/api/parent/children').set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('rejects non-parent role', async () => {
      const res = await request(app).get('/api/parent/children').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/parent/child/:id/grades', () => {
    it('returns child grades for parent', async () => {
      const children = await request(app).get('/api/parent/children').set('Authorization', `Bearer ${parentToken}`);
      const childId = children.body[0].id;
      const res = await request(app).get(`/api/parent/child/${childId}/grades`).set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/parent/child/:id/attendance', () => {
    it('returns child attendance for parent', async () => {
      const children = await request(app).get('/api/parent/children').set('Authorization', `Bearer ${parentToken}`);
      const childId = children.body[0].id;
      const res = await request(app).get(`/api/parent/child/${childId}/attendance`).set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
      expect(res.body).toHaveProperty('summary');
    });
  });
});
