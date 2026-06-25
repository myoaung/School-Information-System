---
name: api-contract
description: Use when the user wants to keep API routes and documentation in sync.
---

# API Contract

1. Scan codebase for API routes (Express, Hono, FastAPI, etc.).
2. Extract route definitions:
   - HTTP method (GET, POST, PUT, DELETE)
   - Path (/api/users/:id)
   - Request body schema
   - Response schema
   - Authentication requirements
3. Generate or update OpenAPI/Swagger documentation.
4. Validate routes match documentation:
   - Missing routes in docs
   - Extra routes not in code
   - Schema mismatches
5. Report inconsistencies and suggest fixes.
