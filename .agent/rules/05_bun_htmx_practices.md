---
activation_mode: glob
glob: "**/*.ts, **/*.html"
---
# Rule: Bun & HTMX Best Practices

## Context
Performance and Hypermedia standards for V3.

## Trigger
* When editing Bun (TS) or HTML files.

## Constraint
* **FORBIDDEN:** Using client-side JSON fetching for UI updates (Use HTML fragments).
* **FORBIDDEN:** `any` type in TypeScript.

## Action
1.  **HTMX:**
    *   MUST use `hx-swap="outerHTML"` or specific target for efficient updates.
    *   MUST return partial HTML snippets, not full pages, for HTMX requests.
