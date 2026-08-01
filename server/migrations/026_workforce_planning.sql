-- dialect: postgres
-- Workforce planning tables

-- Department budget (staffing targets per department)
CREATE TABLE IF NOT EXISTS department_budgets (
  id SERIAL PRIMARY KEY,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  budgeted_positions INTEGER NOT NULL DEFAULT 0,
  filled_positions INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department, academic_year)
);

-- Job vacancies
CREATE TABLE IF NOT EXISTS job_vacancies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range_min REAL,
  salary_range_max REAL,
  vacancy_type TEXT CHECK(vacancy_type IN ('full_time', 'part_time', 'contract', 'intern')) NOT NULL,
  status TEXT CHECK(status IN ('open', 'filled', 'closed', 'cancelled')) DEFAULT 'open',
  posted_date TEXT NOT NULL,
  closing_date TEXT,
  filled_date TEXT,
  filled_by INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_vacancies_department ON job_vacancies(department);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_status ON job_vacancies(status);

-- Staffing gap analysis (snapshot of department staffing)
CREATE TABLE IF NOT EXISTS staffing_gaps (
  id SERIAL PRIMARY KEY,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  gap INTEGER GENERATED ALWAYS AS (required_count - current_count) STORED,
  priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staffing_gaps_department ON staffing_gaps(department);
CREATE INDEX IF NOT EXISTS idx_staffing_gaps_academic_year ON staffing_gaps(academic_year);
