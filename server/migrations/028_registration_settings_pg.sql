-- dialect: postgres
-- Registration periods per grade with seat limits

CREATE TABLE IF NOT EXISTS registration_periods (
  id SERIAL PRIMARY KEY,
  grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  max_seats INTEGER NOT NULL DEFAULT 50,
  current_seats INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK(status IN ('open','closed')) DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grade_id, academic_year_id)
);

-- Extend students table with registration fields (one at a time)
ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name_mm TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nrc_no TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_cert_no TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'new';
ALTER TABLE students ADD COLUMN IF NOT EXISTS prev_school_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS prev_school_location TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS prev_grade_completed TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS transfer_cert_no TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS transfer_cert_date TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_nrc TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_occupation TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_nrc TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_occupation TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_nrc TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_relationship TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone2 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS house_no TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS township TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS state_region TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS special_needs TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_medical_consent INTEGER DEFAULT 0;
