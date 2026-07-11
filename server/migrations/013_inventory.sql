CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('equipment','furniture','lab_supplies','books','stationery','other')) NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  location TEXT,
  condition_status TEXT CHECK(condition_status IN ('new','good','fair','poor','damaged')) DEFAULT 'new',
  purchase_date TEXT,
  purchase_price REAL,
  supplier TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  quantity INTEGER DEFAULT 1,
  type TEXT CHECK(type IN ('issue','return','adjustment')) NOT NULL,
  issue_date TEXT NOT NULL,
  return_date TEXT,
  due_date TEXT,
  status TEXT CHECK(status IN ('issued','returned','overdue')) DEFAULT 'issued',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  maintenance_type TEXT CHECK(maintenance_type IN ('repair','service','inspection','replacement')) NOT NULL,
  description TEXT,
  cost REAL,
  performed_by TEXT,
  maintenance_date TEXT NOT NULL,
  next_service_date TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_status ON inventory_transactions(status);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_item_id ON inventory_maintenance(item_id);
