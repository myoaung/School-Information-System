-- Class Readiness Rules migration

-- Add new columns to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES grades(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS status TEXT CHECK(status IN ('draft','incomplete','ready','active')) DEFAULT 'draft';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Class Subject Teachers (subject-teacher assignments per class)
CREATE TABLE IF NOT EXISTS class_subject_teachers (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  academic_year_id INTEGER REFERENCES academic_years(id),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, subject_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subject_teachers_class ON class_subject_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subject_teachers_teacher ON class_subject_teachers(teacher_id);
