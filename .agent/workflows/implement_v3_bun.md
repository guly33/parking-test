---
description: Implements V3 (Bun + HTMX) variant using V1 as reference.
---

# Workflow: Implement V3 (Bun)

**Trigger:** `/implement_v3_bun`
**Goal:** Build the Bun backend and HTMX server-driven frontend, strictly mirroring V1 logic.

**Prerequisites:**
1.  Run `/scaffold_multi_stack` (if not done).
2.  **Reference V1:** Read `implementations/v1-php-react/backend/src/ReservationController.php` to map logic to Bun/Elysia.
3.  Read `.context/active/rules/05_bun_htmx_practices.md`.

**Execution Steps:**
1.  **Context & Migrations:**
    *   Verify `migrations/20240101000000_init.sql` exists.
    *   Ensure V3 connects to the *same* Database structure.

2.  **Backend Implementation (Bun):**
    *   **Setup:** Initialize `index.ts` with Elysia.
    *   **Connect:** Use `postgres.js` (std driver for Bun).
    *   **Endpoint `POST /api/reservations`:**
        *   Replicate V1 Logic: `authenticate()` -> `LOCK spot` -> `Check Overlap` -> `Insert`.
        *   *Constraint:* Use `sql.begin` transaction with explicit `FOR UPDATE` clause.
    *   **Endpoint `GET /api/spots`:**
        *   **HTMX Difference:** Return *HTML Partial* (`<tr>...</tr>`) for UI, but typically we might need JSON for the Concurrency Test.
        *   *Decision:* Support Hybrid Content Negotiation or use a dedicated API route for JSON if needed. For simplicity, if Concurrency Test expects 201 JSON response, ensure the endpoint responds with 201 on success even if body is HTML (or checks Accept header).

3.  **Frontend Implementation (HTMX):**
    *   **Mounting:** `SlotsPage.js` should fetch initial HTML from Bun and inject it.
    *   **Interactivity:** Use `hx-post="/api/reservations"` on the "Book" method.

4.  **Verify:**
    *   Start V3 container: `docker-compose up -d v3-bun`.
    *   Run Concurrency Test (pointing to port 8083).

**Output:**
* **Success:** "✅ V3 Bun+HTMX Operational (Parity Checked)"
