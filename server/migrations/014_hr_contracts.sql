-- Staff contracts table for HR management
CREATE TABLE IF NOT EXISTS staff_contracts (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  contract_type TEXT CHECK(contract_type IN ('permanent','temporary','probation','contract','intern')) NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  salary REAL,
  position TEXT,
  department TEXT,
  status TEXT CHECK(status IN ('active','expired','terminated','renewed')) DEFAULT 'active',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_contracts_staff_id ON staff_contracts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_contracts_status ON staff_contracts(status);
CREATE INDEX IF NOT EXISTS idx_staff_contracts_end_date ON staff_contracts(end_date);
