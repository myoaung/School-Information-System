CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT CHECK(category IN ('salary','supplies','maintenance','utilities','transport','events','other')) NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  paid_to TEXT,
  payment_method TEXT CHECK(payment_method IN ('cash','bank_transfer','cheque','mobile_payment','other')) DEFAULT 'cash',
  receipt_url TEXT,
  approved_by INTEGER REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
