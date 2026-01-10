---
activation_mode: glob
glob: "**/*.py"
---
# Rule: Python Best Practices

## Context
Modern Python standards for V2 implementation.

## Trigger
* When editing Python files.

## Constraint
* **FORBIDDEN:** Wildcard imports (`from module import *`).
* **FORBIDDEN:** Mutating global state.

## Action
1.  **Async:**
    *   MUST use `async def` for route handlers (FastAPI).
    *   MUST use `await` for DB calls.
2.  **Typing:**
    *   MUST use Type Hints (`def foo() -> str:`).
