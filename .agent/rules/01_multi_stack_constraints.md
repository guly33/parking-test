---
trigger: always_on
---


# Rule: Multi-Stack Assignment Constraints
## Context
Ensuring all 3 implementations meet the strict assignment criteria despite different languages.
## Trigger
* When working inside `implementations/`.
## Constraint (The "No")
* **FORBIDDEN:** Rewriting the provided Vanilla JS Router/Auth (must integrate INTO it).
* **FORBIDDEN:** Sharing code between variants (they must be standalone).
* **FORBIDDEN:** Using ORM auto-sync (All stacks must use explicit SQL/migrations).
## Action (The "Yes")
1.  **Tech Stack & Integration:**
    * **V1 (PHP):** MUST use React mounted in `SlotsPage.js`.
    * **V2 (Python):** MUST use Vue mounted in `SlotsPage.js`.
    * **V3 (Bun):** MUST use HTMX injected into `SlotsPage.js`.
2.  **Concurrency:**
    * **PHP**: Use `PDO` with transactions.
    * **Python**: Use `SQLAlchemy Core` (not ORM) or raw cursor with `FOR UPDATE`.
    * **Bun**: Use `postgres.js` with transactions.