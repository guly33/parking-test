# ADR 004: Database Access & Migrations

## Status
Accepted

## Context
The assignment forbids "auto-sync" features of ORMs and mandates explicit usage of migrations.

## Decision
We will use **Raw SQL / Query Builders** paired with a **Migration Runner**.

## Rationale
1.  **Compliance:** explicitly satisfies the "No auto-sync" constraint.
2.  **Control:** Gives us precise control over the `FOR UPDATE` locking syntax which can sometimes be obscured by high-level ORMs.
3.  **Uniformity:** We can use the same SQL schema across all 3 variants.

## Implementation Details
*   **Schema:** Defined in `.sql` files common to all projects (or duplicated per project if needed for ease of independent execution).
*   **V1 (Node/PHP):** Use a tool like `knex` (Node) or specific migration commands (PHP).
*   **V2 (Python):** Use `alembic` (if SQLAlchemy) or just raw SQL runner.
*   **V3 (Bun):** Use built-in SQLite execution or `dbmate` for Postgres.
