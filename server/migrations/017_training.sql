-- Training & Development tables

CREATE TABLE IF NOT EXISTS training_programs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  trainer TEXT,
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  max_participants INTEGER,
  status TEXT CHECK(status IN ('planned','active','completed','cancelled')) DEFAULT 'planned',
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_programs_status ON training_programs(status);

CREATE TABLE IF NOT EXISTS training_assignments (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('enrolled','in_progress','completed','dropped')) DEFAULT 'enrolled',
  completion_date TEXT,
  certificate_url TEXT,
  feedback TEXT,
  rating TEXT CHECK(rating IN ('excellent','good','satisfactory','poor')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_training_assignments_program ON training_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_staff ON training_assignments(staff_id);
