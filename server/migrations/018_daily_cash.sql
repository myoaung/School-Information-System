-- Daily Cash Control tables

CREATE TABLE IF NOT EXISTS cash_sessions (
  id SERIAL PRIMARY KEY,
  session_date TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  opened_by INTEGER NOT NULL REFERENCES users(id),
  closed_by INTEGER REFERENCES users(id),
  opening_balance REAL NOT NULL DEFAULT 0,
  closing_balance REAL,
  actual_balance REAL,
  variance REAL,
  status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
  notes TEXT,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_sessions_date ON cash_sessions(session_date, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id SERIAL PRIMARY KEY,
  cash_session_id INTEGER NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('income', 'expense', 'refund', 'adjustment')) NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile_payment', 'other')) DEFAULT 'cash',
  reference TEXT,
  description TEXT,
  related_invoice_id INTEGER REFERENCES invoices(id),
  related_expense_id INTEGER REFERENCES expenses(id),
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_session ON cash_transactions(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(type);
