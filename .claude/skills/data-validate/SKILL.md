---
name: data-validate
description: Use when the user wants to validate data files with schema and sanity checks.
---

# Data Validate

1. Read the data file (CSV, JSON, or other format).
2. Check schema:
   - Required fields present
   - Data types correct (string, number, date, etc.)
   - Field names match expected format
3. Run sanity checks:
   - No duplicate rows
   - No empty/null values in required fields
   - Values within expected ranges
   - Dates are valid and in correct format
   - Emails/URLs are properly formatted
4. Report issues found with severity (error, warning, info).
5. Suggest fixes or corrections.
