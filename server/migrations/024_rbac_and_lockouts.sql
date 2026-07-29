-- dialect: postgres

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  can_create INTEGER DEFAULT 0,
  can_read INTEGER DEFAULT 0,
  can_update INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, area_id)
);

-- Create account_lockouts table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  attempt_time TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_time ON account_lockouts(attempt_time);

-- Seed roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'Full system access', 1),
  ('teacher', 'Teacher — can manage classes, view students, mark attendance', 1),
  ('student', 'Student — can view own records', 1),
  ('parent', 'Parent — can view linked children records', 1),
  ('accountant', 'Accountant — can manage finances', 1),
  ('staff', 'General staff — read-only access to most areas', 1)
ON CONFLICT (name) DO NOTHING;

-- Seed areas
INSERT INTO areas (name, description) VALUES
  ('students', 'Student records, enrollment, lifecycle'),
  ('teachers', 'Teacher profiles, qualifications'),
  ('classes', 'Class management, scheduling'),
  ('finance', 'Fee structures, invoices, payments'),
  ('attendance', 'Student and teacher attendance tracking'),
  ('reports', 'Academic reports, analytics, exports'),
  ('academic', 'Academic years, semesters, holidays'),
  ('curriculum', 'Curriculum and subject setup'),
  ('timetable', 'Timetable scheduling'),
  ('announcements', 'School announcements'),
  ('documents', 'Document management'),
  ('courses', 'Course catalog, lessons, assignments, quizzes'),
  ('chat', 'Chat logs and AI chatbot'),
  ('hr', 'HR staff management, leaves, contracts'),
  ('recruitment', 'Job postings and applications'),
  ('training', 'Training programs'),
  ('inventory', 'School inventory and supplies'),
  ('library', 'Library books and borrows'),
  ('notifications', 'Notification system'),
  ('accounting', 'Double-entry accounting, ledger, reconciliation'),
  ('cash-control', 'Daily cash sessions'),
  ('budgeting', 'Budget management'),
  ('expenses', 'Expense tracking and procurement'),
  ('users', 'User account management')
ON CONFLICT (name) DO NOTHING;

-- Seed default permissions (admin gets full CRUD on everything)
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 1, 1, 1, 1
FROM roles r, areas a
WHERE r.name = 'admin'
ON CONFLICT (role_id, area_id) DO NOTHING;

-- Teacher: read on most areas
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 0, 1, 0, 0
FROM roles r, areas a
WHERE r.name = 'teacher'
  AND a.name IN ('students', 'classes', 'attendance', 'reports', 'academic', 'curriculum', 'timetable', 'announcements', 'courses')
ON CONFLICT (role_id, area_id) DO NOTHING;

-- Student: read on own areas
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 0, 1, 0, 0
FROM roles r, areas a
WHERE r.name = 'student'
  AND a.name IN ('attendance', 'reports', 'academic', 'courses', 'announcements', 'timetable')
ON CONFLICT (role_id, area_id) DO NOTHING;

-- Parent: read on child-related areas
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 0, 1, 0, 0
FROM roles r, areas a
WHERE r.name = 'parent'
  AND a.name IN ('students', 'attendance', 'reports', 'academic', 'courses', 'announcements', 'timetable')
ON CONFLICT (role_id, area_id) DO NOTHING;

-- Accountant: full CRUD on finance areas
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 1, 1, 1, 1
FROM roles r, areas a
WHERE r.name = 'accountant'
  AND a.name IN ('finance', 'accounting', 'cash-control', 'budgeting', 'expenses')
ON CONFLICT (role_id, area_id) DO NOTHING;

-- Staff: read on most areas
INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
SELECT r.id, a.id, 0, 1, 0, 0
FROM roles r, areas a
WHERE r.name = 'staff'
  AND a.name IN ('students', 'teachers', 'classes', 'attendance', 'reports', 'announcements', 'documents', 'library')
ON CONFLICT (role_id, area_id) DO NOTHING;
