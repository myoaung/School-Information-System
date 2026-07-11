CREATE TABLE IF NOT EXISTS library_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT CHECK(category IN ('fiction','non-fiction','textbook','reference','other')) DEFAULT 'other',
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  description TEXT,
  cover_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_borrows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES library_books(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  borrow_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT CHECK(status IN ('borrowed','returned','overdue')) DEFAULT 'borrowed',
  fine REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_library_books_category ON library_books(category);
CREATE INDEX IF NOT EXISTS idx_library_borrows_user_id ON library_borrows(user_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_book_id ON library_borrows(book_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_status ON library_borrows(status);
