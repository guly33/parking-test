---
activation_mode: glob
glob: "**/*.php"
---
# Rule: PHP Best Practices

## Context
Modern PHP standards for V1 implementation.

## Trigger
* When editing PHP files.

## Constraint
* **FORBIDDEN:** Using `mysql_` functions (Deprecated).
* **FORBIDDEN:** Raw SQL concatenation (SQL Injection risk).

## Action
1.  **Type Safety:**
    *   MUST use `declare(strict_types=1);`.
    *   MUST use Return Type Declarations.
2.  **Database:**
    *   MUST use PDO Prepared Statements.
