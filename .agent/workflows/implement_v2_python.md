---
description: Implements V2 (Python + Vue) variant using V1 as reference.
---

# Workflow: Implement V2 (Python)

**Trigger:** `/implement_v2_python`
**Goal:** Build the Python backend and Vue frontend integration, strictly mirroring V1 logic and naming.

**Prerequisites:**
1.  Run `/scaffold_multi_stack` (if not done).
2.  **Reference V1:** Read `implementations/v1-php-react/backend/src/ReservationController.php` and `Models/Spot.php` to understand the locking logic.
3.  Read `.context/active/rules/04_python_practices.md`.

**Execution Steps:**
1.  **Context & Migrations:**
    *   Verify `migrations/20240101000000_init.sql` exists (Shared Source of Truth).
    *   Ensure V2 connects to the *same* Database structure (tables: `spots`, `reservations`, `users`).

2.  **Backend Implementation (Python):**
    *   **Setup:** Initialize `main.py` with FastAPI and SQLAlchemy Core.
    *   **Connect:** Use `DATABASE_URL` from env.
    *   **Endpoint `POST /api/reservations`:**
        *   Replicate V1 Logic: `authenticate()` -> `LOCK spot` -> `Check Overlap` -> `Insert`.
        *   *Constraint:* Must use `with_for_update()` provided by SQLAlchemy.
    *   **Endpoint `GET /api/spots`:**
        *   Return same JSON structure as V1: `[{id, name, type, reservations: []}]`.

3.  **Frontend Implementation (Vue):**
    *   **Mounting:** Update `SlotsPage.js` to mount `ParkingSlots.vue` into `#parking-slots-view` (ADR 003).
    *   **Logic:** Port `ParkingSlots.jsx` (React) logic to Vue Compositon API.
    *   **Styling:** Reuse `style.css` (Global).

4.  **Verify:**
    *   Start V2 container: `docker-compose up -d v2-python`.
    *   Run Concurrency Test (pointing to port 8082).

**Output:**
* **Success:** "✅ V2 Python+Vue Operational (Parity Checked)"
