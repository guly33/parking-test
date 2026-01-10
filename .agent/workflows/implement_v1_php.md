---
description: Implements V1 (PHP + React) variant.
---

# Workflow: Implement V1 (PHP)

**Trigger:** `/implement-v1-php`
**Goal:** Build the PHP backend and React frontend integration.

**Prerequisites:**
1.  Run `/scaffold-multi-stack` first.
2.  Read `.agent/rules/smart_parking_spec.md`.
3.  Read `.agent/rules/02_general_practices.md`.
4.  Read `.agent/rules/03_php_practices.md`.


** First run **
**Execution Steps:**
1.  **Backend (PHP):**
    *   Setup `public/index.php`.
    *   Implement Database Connection (PDO).
    *   Implement `POST /reservations` with `FOR UPDATE`.
    *   Implement WebSocket broadcast (optional: using simple push or separate node service).

2.  **Frontend (React):**
    *   Install React dependencies in `implementations/v1-php-react/frontend`.
    *   Create `src/components/ParkingSlots.jsx`.
    *   Mount in `SlotsPage.js`.

** Iterations **
1. **READ** `.context/active/task.md`.
2. **READ** `.context/active/verification_plan.md`.
3. **IMPLEMENT** according to task.md instructions.

3.  **Verify:**
    *   Start V1 container.
    *   Execute checks defined in `.context/active/verification_plan.md`.
    *   Run curl test for concurrency.

**Output:**
* **Success:** "✅ V1 PHP+React Operational"