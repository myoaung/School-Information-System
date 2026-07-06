-- Supabase Migration: Initial Schema
-- Converted from SQLite to PostgreSQL

-- ─── Helper function for migrations ─────────────────────────────
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSONB AS $$
BEGIN
  EXECUTE query;
  RETURN '{"success": true}'::jsonb;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Enable UUID extension (optional, for future use) ────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Education Levels ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS education_levels (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- ─── Grades ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  education_level_id INTEGER REFERENCES education_levels(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER
);

-- ─── Subjects ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT
);

-- ─── Grade-Subject Mapping ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS grade_subjects (
  id SERIAL PRIMARY KEY,
  grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year TEXT,
  weekly_periods INTEGER,
  is_required INTEGER DEFAULT 1,
  UNIQUE(grade_id, subject_id)
);

-- ─── Users ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'teacher', 'admin', 'parent')) NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Students Profile ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  grade_id INTEGER REFERENCES grades(id),
  section TEXT DEFAULT 'A',
  date_of_birth TEXT,
  gender TEXT CHECK(gender IN ('male','female','other')),
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  status TEXT CHECK(status IN ('active','suspended','graduated','transferred')) DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Teachers Profile ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT UNIQUE,
  phone TEXT,
  qualification TEXT,
  specialization TEXT,
  hire_date TEXT,
  status TEXT CHECK(status IN ('active','on_leave','resigned')) DEFAULT 'active'
);

-- ─── Classes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  schedule TEXT,
  room TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Enrollments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, student_id)
);

-- ─── Announcements ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  grade_id INTEGER REFERENCES grades(id),
  class_id INTEGER REFERENCES classes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Attendance ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT CHECK(status IN ('present','absent','late','leave')) NOT NULL,
  note TEXT,
  marked_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, class_id, date)
);

-- ─── Timetable ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Academic Years ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current INTEGER DEFAULT 0
);

-- ─── Semesters ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current INTEGER DEFAULT 0
);

-- ─── Holidays ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT CHECK(type IN ('public','school','exam')) DEFAULT 'school'
);

-- ─── Courses ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Lessons ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  lesson_order INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Resources ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('pdf','video','audio','image','link','document')) NOT NULL,
  url TEXT,
  file_path TEXT,
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Assignments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  max_score INTEGER DEFAULT 100,
  allow_late INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Submissions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  file_path TEXT,
  score INTEGER,
  feedback TEXT,
  status TEXT CHECK(status IN ('submitted','graded','late','returned')) DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP,
  graded_by INTEGER REFERENCES users(id),
  UNIQUE(assignment_id, student_id)
);

-- ─── Quizzes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  max_score INTEGER DEFAULT 100,
  due_date TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Quiz Questions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK(question_type IN ('mcq','true_false','fill_blank','essay')) NOT NULL,
  options TEXT,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  question_order INTEGER DEFAULT 0
);

-- ─── Quiz Attempts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT,
  score INTEGER,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ─── Gradebook ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gradebook (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  assignment_score REAL DEFAULT 0,
  quiz_score REAL DEFAULT 0,
  exam_score REAL DEFAULT 0,
  final_grade TEXT,
  gpa REAL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- ─── Parent-Student Links ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_students (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, student_id)
);

-- ─── Messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Notifications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Fee Structures ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  amount REAL NOT NULL,
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Invoices ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE SET NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue','cancelled')),
  due_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Payments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_method TEXT,
  reference TEXT,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Certificates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('completion','achievement','transcript','graduation')),
  template TEXT,
  data TEXT,
  issued_by INTEGER REFERENCES users(id),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  serial_number TEXT UNIQUE
);

-- ─── Teacher Attendance ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','leave')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, date)
);

-- ─── Chat Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  file_name TEXT,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Contacts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── AI Reports (Phase 3) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_reports (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  generated_by INTEGER REFERENCES users(id),
  narrative TEXT,
  status TEXT CHECK(status IN ('draft','approved','rejected','sent')) DEFAULT 'draft',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── AI Alerts (Phase 4) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_alerts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('low','medium','high','critical')) DEFAULT 'medium',
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── AI Interventions (Phase 4) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_interventions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('suggested','accepted','completed','dismissed')) DEFAULT 'suggested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_student_id ON gradebook(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_student_id ON ai_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_student_id ON ai_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_student_id ON ai_interventions(student_id);

-- ─── Row Level Security (RLS) ────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interventions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (customize as needed)
-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Teachers can view assigned classes" ON classes
  FOR SELECT USING (teacher_id::text = auth.uid()::text);

-- Admin full access (use service key to bypass RLS)
-- For now, service key will bypass all RLS policies

COMMENT ON TABLE users IS 'Core user accounts with roles';
COMMENT ON TABLE students IS 'Student profiles linked to users';
COMMENT ON TABLE teachers IS 'Teacher profiles linked to users';
COMMENT ON TABLE ai_reports IS 'AI-generated student report cards';
COMMENT ON TABLE ai_alerts IS 'At-risk student alerts';
COMMENT ON TABLE ai_interventions IS 'Suggested interventions for at-risk students';
