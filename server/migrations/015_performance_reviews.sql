CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id),
  review_type TEXT CHECK(review_type IN ('probation','annual','mid_year','observation','goal_setting','other')) NOT NULL,
  review_period TEXT,
  reviewer_id INTEGER REFERENCES users(id),
  rating TEXT CHECK(rating IN ('excellent','good','satisfactory','needs_improvement','unsatisfactory')),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  development_plan TEXT,
  comments TEXT,
  status TEXT CHECK(status IN ('draft','submitted','acknowledged','completed')) DEFAULT 'draft',
  review_date TEXT,
  next_review_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_staff_id ON performance_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_review_type ON performance_reviews(review_type);
