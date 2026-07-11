-- Accounts Receivable: write-off tracking

CREATE TABLE IF NOT EXISTS ar_writeoffs (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  amount REAL NOT NULL,
  reason TEXT,
  written_off_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ar_writeoffs_invoice ON ar_writeoffs(invoice_id);
