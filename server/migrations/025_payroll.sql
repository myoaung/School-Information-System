-- dialect: postgres
-- Payroll system tables

-- Salary structures (pay grades)
CREATE TABLE IF NOT EXISTS salary_structures (
  id SERIAL PRIMARY KEY,
  grade_name TEXT NOT NULL UNIQUE,
  min_salary REAL NOT NULL,
  max_salary REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Allowance types
CREATE TABLE IF NOT EXISTS allowance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_taxable BOOLEAN DEFAULT true,
  is_fixed BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Deduction types
CREATE TABLE IF NOT EXISTS deduction_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_tax BOOLEAN DEFAULT false,
  is_fixed BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff salary assignments (link staff to salary structure + custom allowances/deductions)
CREATE TABLE IF NOT EXISTS staff_salary_assignments (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  salary_structure_id INTEGER REFERENCES salary_structures(id),
  basic_salary REAL NOT NULL,
  effective_date TEXT NOT NULL,
  end_date TEXT,
  status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_salary_staff_id ON staff_salary_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_status ON staff_salary_assignments(status);

-- Staff allowance assignments
CREATE TABLE IF NOT EXISTS staff_allowances (
  id SERIAL PRIMARY KEY,
  staff_salary_id INTEGER NOT NULL REFERENCES staff_salary_assignments(id),
  allowance_type_id INTEGER NOT NULL REFERENCES allowance_types(id),
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff deduction assignments
CREATE TABLE IF NOT EXISTS staff_deductions (
  id SERIAL PRIMARY KEY,
  staff_salary_id INTEGER NOT NULL REFERENCES staff_salary_assignments(id),
  deduction_type_id INTEGER NOT NULL REFERENCES deduction_types(id),
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  staff_salary_id INTEGER REFERENCES staff_salary_assignments(id),
  pay_period TEXT NOT NULL,
  pay_date TEXT NOT NULL,
  basic_salary REAL NOT NULL,
  total_allowances REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  net_salary REAL NOT NULL,
  status TEXT CHECK(status IN ('draft', 'approved', 'paid', 'cancelled')) DEFAULT 'draft',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payslips_staff_id ON payslips(staff_id);
CREATE INDEX IF NOT EXISTS idx_payslips_pay_period ON payslips(pay_period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- Payslip line items (detailed breakdown)
CREATE TABLE IF NOT EXISTS payslip_items (
  id SERIAL PRIMARY KEY,
  payslip_id INTEGER NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  item_type TEXT CHECK(item_type IN ('allowance', 'deduction')) NOT NULL,
  item_name TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payslip_items_payslip_id ON payslip_items(payslip_id);
