-- Add academic_year_id to grade_subjects for versioning
-- Same subject can appear in different academic years

-- SQLite: add column if not exists
ALTER TABLE grade_subjects ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id);
