-- dialect: sqlite
-- Registration periods per grade with seat limits

CREATE TABLE IF NOT EXISTS registration_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grade_id INTEGER NOT NULL,
  academic_year_id INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  max_seats INTEGER NOT NULL DEFAULT 50,
  current_seats INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK(status IN ('open','closed')) DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  UNIQUE(grade_id, academic_year_id)
);

-- Extend students table with registration fields from New Student Register Field.md
ALTER TABLE students ADD COLUMN full_name_mm TEXT;
ALTER TABLE students ADD COLUMN nationality TEXT;
ALTER TABLE students ADD COLUMN ethnicity TEXT;
ALTER TABLE students ADD COLUMN religion TEXT;
ALTER TABLE students ADD COLUMN nrc_no TEXT;
ALTER TABLE students ADD COLUMN birth_cert_no TEXT;
ALTER TABLE students ADD COLUMN enrollment_type TEXT DEFAULT 'new';
ALTER TABLE students ADD COLUMN prev_school_name TEXT;
ALTER TABLE students ADD COLUMN prev_school_location TEXT;
ALTER TABLE students ADD COLUMN prev_grade_completed TEXT;
ALTER TABLE students ADD COLUMN transfer_cert_no TEXT;
ALTER TABLE students ADD COLUMN transfer_cert_date TEXT;
ALTER TABLE students ADD COLUMN father_name TEXT;
ALTER TABLE students ADD COLUMN father_nrc TEXT;
ALTER TABLE students ADD COLUMN father_occupation TEXT;
ALTER TABLE students ADD COLUMN father_phone TEXT;
ALTER TABLE students ADD COLUMN father_email TEXT;
ALTER TABLE students ADD COLUMN mother_name TEXT;
ALTER TABLE students ADD COLUMN mother_nrc TEXT;
ALTER TABLE students ADD COLUMN mother_occupation TEXT;
ALTER TABLE students ADD COLUMN mother_phone TEXT;
ALTER TABLE students ADD COLUMN mother_email TEXT;
ALTER TABLE students ADD COLUMN guardian_name TEXT;
ALTER TABLE students ADD COLUMN guardian_relationship TEXT;
ALTER TABLE students ADD COLUMN guardian_nrc TEXT;
ALTER TABLE students ADD COLUMN guardian_phone TEXT;
ALTER TABLE students ADD COLUMN guardian_email TEXT;
ALTER TABLE students ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE students ADD COLUMN emergency_relationship TEXT;
ALTER TABLE students ADD COLUMN emergency_phone2 TEXT;
ALTER TABLE students ADD COLUMN house_no TEXT;
ALTER TABLE students ADD COLUMN street TEXT;
ALTER TABLE students ADD COLUMN ward TEXT;
ALTER TABLE students ADD COLUMN township TEXT;
ALTER TABLE students ADD COLUMN state_region TEXT;
ALTER TABLE students ADD COLUMN permanent_address TEXT;
ALTER TABLE students ADD COLUMN medical_conditions TEXT;
ALTER TABLE students ADD COLUMN medications TEXT;
ALTER TABLE students ADD COLUMN special_needs TEXT;
ALTER TABLE students ADD COLUMN emergency_medical_consent INTEGER DEFAULT 0;
