-- Recruitment & Onboarding tables

CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  position TEXT,
  employment_type TEXT CHECK(employment_type IN ('full_time','part_time','contract','intern')) DEFAULT 'full_time',
  salary_range TEXT,
  requirements TEXT,
  status TEXT CHECK(status IN ('open','closed','filled')) DEFAULT 'open',
  posted_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT,
  applicant_phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT CHECK(status IN ('new','reviewing','interview','offered','hired','rejected')) DEFAULT 'new',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  interviewer_id INTEGER REFERENCES users(id),
  scheduled_at DATETIME,
  location TEXT,
  notes TEXT,
  result TEXT CHECK(result IN ('pending','pass','fail','conditional')) DEFAULT 'pending',
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
