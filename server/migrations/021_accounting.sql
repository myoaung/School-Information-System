-- Accounting Integration tables

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id INTEGER REFERENCES accounts(id),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);

-- Journal Entries (header)
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  reference TEXT,
  description TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft', 'posted', 'reversed')) DEFAULT 'draft',
  source_type TEXT,
  source_id INTEGER,
  academic_year_id INTEGER,
  posted_by INTEGER REFERENCES users(id),
  posted_at DATETIME,
  reversed_by INTEGER REFERENCES users(id),
  reversed_at DATETIME,
  reversal_reason TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source_type, source_id);

-- Journal Entry Lines (debit/credit)
CREATE TABLE IF NOT EXISTS journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  debit REAL DEFAULT 0 CHECK(debit >= 0),
  credit REAL DEFAULT 0 CHECK(credit >= 0),
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);

-- Accounting Periods
CREATE TABLE IF NOT EXISTS accounting_periods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
  closed_by INTEGER REFERENCES users(id),
  closed_at DATETIME,
  academic_year_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(status);

-- Bank Reconciliations
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  statement_date TEXT NOT NULL,
  statement_balance REAL NOT NULL,
  book_balance REAL NOT NULL,
  difference REAL NOT NULL,
  status TEXT CHECK(status IN ('draft', 'reconciled')) DEFAULT 'draft',
  notes TEXT,
  reconciled_by INTEGER REFERENCES users(id),
  reconciled_at DATETIME,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_account ON bank_reconciliations(account_id);

-- Reconciliation Lines (links entries to reconciliation)
CREATE TABLE IF NOT EXISTS reconciliation_lines (
  id SERIAL PRIMARY KEY,
  reconciliation_id INTEGER NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  reconciled BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_lines_recon ON reconciliation_lines(reconciliation_id);

-- ─── Seed Default Chart of Accounts ─────────────────────────────

-- Assets
INSERT INTO accounts (code, name, type, description) VALUES
  ('1000', 'Cash', 'asset', 'Cash on hand and in registers'),
  ('1100', 'Bank Account', 'asset', 'Main bank account'),
  ('1200', 'Accounts Receivable', 'asset', 'Amounts owed by students/parents'),
  ('1300', 'Prepaid Expenses', 'asset', 'Expenses paid in advance');

-- Liabilities
INSERT INTO accounts (code, name, type, description) VALUES
  ('2000', 'Accounts Payable', 'liability', 'Amounts owed to suppliers'),
  ('2100', 'Unearned Revenue', 'liability', 'Fees received but not yet earned'),
  ('2200', 'Tax Payable', 'liability', 'Taxes collected and payable');

-- Equity
INSERT INTO accounts (code, name, type, description) VALUES
  ('3000', 'Retained Earnings', 'equity', 'Accumulated earnings'),
  ('3100', 'Current Year Earnings', 'equity', 'Current year net income/loss');

-- Revenue
INSERT INTO accounts (code, name, type, description) VALUES
  ('4000', 'Tuition Fees', 'revenue', 'Income from tuition fees'),
  ('4100', 'Registration Fees', 'revenue', 'Income from registration fees'),
  ('4200', 'Other Income', 'revenue', 'Miscellaneous income');

-- Expenses
INSERT INTO accounts (code, name, type, description) VALUES
  ('5000', 'Salary Expense', 'expense', 'Staff salaries and wages'),
  ('5100', 'Utility Expense', 'expense', 'Electricity, water, internet'),
  ('5200', 'Supply Expense', 'expense', 'Office and school supplies'),
  ('5300', 'Maintenance Expense', 'expense', 'Building and equipment maintenance'),
  ('5400', 'Transport Expense', 'expense', 'Vehicle and transportation costs'),
  ('5500', 'Event Expense', 'expense', 'School events and activities'),
  ('5600', 'Miscellaneous Expense', 'expense', 'Other operating expenses');
