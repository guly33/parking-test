---
description: Scaffolds the directory structure for V1, v2, and V3.
---

# Workflow: Scaffold Multi-Stack

**Trigger:** `/scaffold-multi-stack`
**Goal:** Create directory structures and base files for all 3 variants.

**Prerequisites:**
1.  Read `.agent/rules/01_multi_stack_constraints.md`.
2.  Read `.context/active/smart_parking_spec.md`.

**Execution Steps:**
// turbo
1.  **Structure Creation:**
    * Create `implementations/v1-php-react`.
    * Create `implementations/v2-python-vue`.
    * Create `implementations/v3-bun-htmx`.

2.  **Base Frontend Copy:**
    * Copy `frontend/` to `implementations/v1-php-react/frontend`.
    * Copy `frontend/` to `implementations/v2-python-vue/frontend`.
    * Copy `frontend/` to `implementations/v3-bun-htmx/frontend`.

3.  **Environment Setup:**
    * Create `docker-compose.yml` (overwriting existing generic one or updating it to include all 3).

**Output:**
* **Success:** "✅ Scaffolding Complete"
