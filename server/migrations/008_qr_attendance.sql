CREATE TABLE IF NOT EXISTS class_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timetable_id INTEGER REFERENCES timetable(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  room TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  qr_expires_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_qr_code ON class_sessions(qr_code);
