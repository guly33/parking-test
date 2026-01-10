---
activation_mode: glob
glob: "**/*"
---
# Rule: General Smart Parking Practices

## Context
Ensuring consistent quality and assignment compliance across all variants.

## Trigger
* When writing any backend or frontend code.

## Constraint (The "No")
* **FORBIDDEN:** Committing secrets (.env files).
* **FORBIDDEN:** "Magic numbers" for status codes (use constants/enums).
* **FORBIDDEN:** Leaving `console.log` or `print` debugging in production code.

## Action (The "Yes")
1.  **Error Handling:**
    *   MUST return standard HTTP 4xx/5xx codes.
    *   MUST return JSON error responses: `{ "error": "message" }`.
2.  **Environment:**
    *   MUST use `process.env` / `os.environ` for config (DB creds).
