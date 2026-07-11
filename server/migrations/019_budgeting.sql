-- Budgeting tables

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  academic_year_id INTEGER REFERENCES academic_years(id),
  category TEXT NOT NULL,
  description TEXT,
  allocated_amount REAL NOT NULL DEFAULT 0,
  period TEXT CHECK(period IN ('annual', 'quarterly', 'monthly')) DEFAULT 'annual',
  period_start TEXT,
  period_end TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(academic_year_id);
