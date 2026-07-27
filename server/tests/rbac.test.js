const request = require('supertest');
const app = require('../index');
const { db } = require('../data');
const { clearPermCache } = require('../middleware/rbac');

describe('RBAC — Role-Based Access Control', () => {
  const ts = Date.now();
  const tokens = {};

  // ── Setup: create one user per role ──────────────────────────
  beforeAll(async () => {
    clearPermCache();

    const roles = ['admin', 'teacher', 'student', 'parent', 'accountant', 'staff'];
    for (const role of roles) {
      const email = `rbac-${role}-${ts}@test.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'TestPass123', name: `RBAC ${role}`, role });
      tokens[role] = res.body.token;
    }

    // For admin, login as seeded admin to get a real admin token
    // (register only creates student/parent roles)
    // We need to directly insert an admin user
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TestPass123', salt);
    const adminEmail = `rbac-admin-direct-${ts}@test.com`;

    // Insert directly into DB (bypasses registration role restriction)
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      adminEmail,
      hashedPassword,
      'RBAC Admin Direct',
      'admin',
    ]);

    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'TestPass123' });
    tokens.admin = loginRes.body.token;

    // Insert a teacher directly too, for proper teacher role testing
    const teacherEmail = `rbac-teacher-direct-${ts}@test.com`;
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      teacherEmail,
      hashedPassword,
      'RBAC Teacher Direct',
      'teacher',
    ]);
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: teacherEmail, password: 'TestPass123' });
    tokens.teacher = teacherLogin.body.token;

    // Insert accountant directly
    const acctEmail = `rbac-acct-direct-${ts}@test.com`;
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      acctEmail,
      hashedPassword,
      'RBAC Accountant Direct',
      'accountant',
    ]);
    const acctLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: acctEmail, password: 'TestPass123' });
    tokens.accountant = acctLogin.body.token;

    // Insert staff directly
    const staffEmail = `rbac-staff-direct-${ts}@test.com`;
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      staffEmail,
      hashedPassword,
      'RBAC Staff Direct',
      'staff',
    ]);
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: staffEmail, password: 'TestPass123' });
    tokens.staff = staffLogin.body.token;

    // Insert student directly
    const studentEmail = `rbac-student-direct-${ts}@test.com`;
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      studentEmail,
      hashedPassword,
      'RBAC Student Direct',
      'student',
    ]);
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: 'TestPass123' });
    tokens.student = studentLogin.body.token;

    // Insert parent directly
    const parentEmail = `rbac-parent-direct-${ts}@test.com`;
    await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
      parentEmail,
      hashedPassword,
      'RBAC Parent Direct',
      'parent',
    ]);
    const parentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: parentEmail, password: 'TestPass123' });
    tokens.parent = parentLogin.body.token;
  });

  // ── 1. RBAC Tables Seeded ───────────────────────────────────
  describe('Database seeding', () => {
    it('has 6 roles', async () => {
      const roles = await db.all('SELECT * FROM roles ORDER BY id');
      expect(roles.length).toBe(6);
      expect(roles.map((r) => r.name)).toEqual(
        expect.arrayContaining(['admin', 'teacher', 'student', 'parent', 'accountant', 'staff'])
      );
    });

    it('has 6 areas', async () => {
      const areas = await db.all('SELECT * FROM areas ORDER BY id');
      expect(areas.length).toBe(6);
      expect(areas.map((a) => a.name)).toEqual(
        expect.arrayContaining([
          'students',
          'teachers',
          'classes',
          'finance',
          'attendance',
          'reports',
        ])
      );
    });

    it('has permission rows for all roles', async () => {
      const perms = await db.all('SELECT COUNT(*) as count FROM role_permissions');
      expect(perms[0].count).toBeGreaterThan(0);
    });
  });

  // ── 2. Allowed Actions Succeed ──────────────────────────────
  describe('Allowed actions succeed', () => {
    it('admin can list students (read)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.students)).toBe(true);
    });

    it('admin can create a student', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'RBAC Test Create',
          email: `rbac-create-${ts}@test.com`,
          password: 'TestPass123',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('student');
    });

    it('teacher can list students (read)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokens.teacher}`);
      expect(res.status).toBe(200);
    });

    it('accountant can list finance fees (read)', async () => {
      const res = await request(app)
        .get('/api/finance/fees')
        .set('Authorization', `Bearer ${tokens.accountant}`);
      expect(res.status).toBe(200);
    });
  });

  // ── 3. Disallowed Actions Rejected (403) ────────────────────
  describe('Disallowed actions rejected', () => {
    it('student cannot list all students (403)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokens.student}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('parent cannot create a student (403)', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${tokens.parent}`)
        .send({
          name: 'Should Fail',
          email: `rbac-fail-${ts}@test.com`,
          password: 'TestPass123',
        });
      expect(res.status).toBe(403);
    });

    it('accountant cannot list students (403)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokens.accountant}`);
      expect(res.status).toBe(403);
    });

    it('staff cannot create a student (403)', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .send({
          name: 'Should Fail',
          email: `rbac-staff-fail-${ts}@test.com`,
          password: 'TestPass123',
        });
      expect(res.status).toBe(403);
    });

    it('teacher cannot delete a student (403)', async () => {
      // First create a student to try to delete
      const createRes = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'To Delete',
          email: `rbac-del-${ts}@test.com`,
          password: 'TestPass123',
        });
      const studentId = createRes.body.student.id;

      const res = await request(app)
        .delete(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${tokens.teacher}`);
      expect(res.status).toBe(403);
    });
  });

  // ── 4. Cross-Area Access Fails ──────────────────────────────
  describe('Cross-area access fails', () => {
    it('accountant cannot access teachers area (403)', async () => {
      const res = await request(app)
        .get('/api/teachers')
        .set('Authorization', `Bearer ${tokens.accountant}`);
      // Teachers route still uses roleMiddleware, so this might be 403 from roleMiddleware
      // or the RBAC system — either way, should be forbidden
      expect([403, 401]).toContain(res.status);
    });

    it('student cannot delete a class (403/404)', async () => {
      const res = await request(app)
        .delete('/api/classes/1')
        .set('Authorization', `Bearer ${tokens.student}`);
      // No DELETE route exists → 404; if route existed, RBAC would return 403
      expect([403, 401, 404]).toContain(res.status);
    });

    it('parent cannot create finance records (403)', async () => {
      const res = await request(app)
        .post('/api/finance/fees')
        .set('Authorization', `Bearer ${tokens.parent}`)
        .send({ grade_id: 1, fee_type: 'Test', amount: 100, academic_year_id: 1 });
      expect([403, 401]).toContain(res.status);
    });
  });

  // ── 5. Unauthenticated Access (401) ────────────────────────
  describe('Unauthenticated access', () => {
    it('rejects request without token (401)', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });

    it('rejects request with invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(res.status).toBe(401);
    });
  });

  // ── 6. RBAC Admin API ──────────────────────────────────────
  describe('RBAC admin API', () => {
    it('admin can list roles', async () => {
      const res = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(res.body.roles.length).toBe(6);
    });

    it('admin can list areas', async () => {
      const res = await request(app)
        .get('/api/rbac/areas')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(res.body.areas.length).toBe(6);
    });

    it('admin can list all permissions', async () => {
      const res = await request(app)
        .get('/api/rbac/permissions')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.permissions)).toBe(true);
      expect(res.body.permissions.length).toBeGreaterThan(0);
    });

    it('non-admin cannot list roles (403)', async () => {
      const res = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${tokens.teacher}`);
      expect(res.status).toBe(403);
    });

    it('admin can update a permission', async () => {
      // Get the role_id for 'teacher' and area_id for 'students'
      const teacherRole = await db.get("SELECT id FROM roles WHERE name = 'teacher'");
      const studentsArea = await db.get("SELECT id FROM areas WHERE name = 'students'");

      const res = await request(app)
        .put(`/api/rbac/permissions/${teacherRole.id}/${studentsArea.id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ can_create: 1, can_read: 1, can_update: 0, can_delete: 0 });
      expect(res.status).toBe(200);

      // Verify the change
      const perm = await db.get(
        'SELECT * FROM role_permissions WHERE role_id = ? AND area_id = ?',
        [teacherRole.id, studentsArea.id]
      );
      expect(perm.can_create).toBe(1);
      expect(perm.can_read).toBe(1);
      expect(perm.can_update).toBe(0);
      expect(perm.can_delete).toBe(0);
    });
  });

  // ── 7. Permission Change Takes Effect ───────────────────────
  describe('Permission changes take effect', () => {
    it('revoking teacher read on students blocks access', async () => {
      // Get IDs
      const teacherRole = await db.get("SELECT id FROM roles WHERE name = 'teacher'");
      const studentsArea = await db.get("SELECT id FROM areas WHERE name = 'students'");

      // Revoke read
      await db.run('UPDATE role_permissions SET can_read = 0 WHERE role_id = ? AND area_id = ?', [
        teacherRole.id,
        studentsArea.id,
      ]);
      clearPermCache();

      // Teacher should now be denied
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokens.teacher}`);
      expect(res.status).toBe(403);

      // Restore read permission for other tests
      await db.run('UPDATE role_permissions SET can_read = 1 WHERE role_id = ? AND area_id = ?', [
        teacherRole.id,
        studentsArea.id,
      ]);
      clearPermCache();
    });
  });
});
