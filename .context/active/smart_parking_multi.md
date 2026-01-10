---
type: spec
description: Architecture for 3 distinct Smart Parking implementations
---

# Spec: Smart Parking (Multi-Stack)

## 1. High-Level Objective
Implement three distinct versions of the Smart Parking system to demonstrate versatility. Each version must satisfy the core concurrency and real-time requirements using a specific tech stack.

## 2. Topology
**Variants:**
1.  **V1:** PHP (Laravel/Symfony or Slim) + React
2.  **V2:** Python (FastAPI/Flask) + Vue
3.  **V3:** Bun (Elysia) + HTMX

**Common Dependencies:**
* PostgreSQL (One DB instance or separate DBs per variant)
* Docker Compose (Orchestration)

## 3. Directory Structure
```text
/home/gp/projects/Oktopost/
  ├── implementations/
  │   ├── v1-php-react/
  │   │   ├── backend/   # PHP
  │   │   └── frontend/  # React integration
  │   ├── v2-python-vue/
  │   │   ├── backend/   # Python
  │   │   └── frontend/  # Vue integration
  │   └── v3-bun-htmx/
  │       ├── backend/   # Bun
  │       └── frontend/  # HTMX integration
  └── docker-compose.yml # Main orchestrator (or individual per folder)
```

## 4. Acceptance Criteria
* [ ] **All Variants:** Pass Concurrency Stress Test.
* [ ] **All Variants:** WebSocket/SSE updates work.
* [ ] **V1 (PHP):** Uses React for the slot grid.
* [ ] **V2 (Python):** Uses Vue for the slot grid.
* [ ] **V3 (Bun):** Uses HTMX for the slot grid (Server Driven UI).

## 5. Verification Plan
* **Automated:** `run_all_tests.sh` (loops through each variant).
* **Manual:** Visual inspection of each frontend to ensure identical behavior across stacks.
