# ADR 005: Backend MVC Architecture

## Status
Accepted

## Context
The initial implementation used a "Fat Controller" approach where SQL queries were embedded directly within the `ReservationController` and `DatabaseAuthProvider`. As functionality grew (overlapping checks, stats, OIDC prep), this became hard to maintain and test.

## Decision
We will adhere to the **MVC (Model-View-Controller)** architectural pattern (specifically Controller-Service-Model or Controller-Model).

## Rationale
1.  **Separation of Concerns:** Database logic (SQL) is isolated in `src/Models/*` (or active record entities), while request handling is restricted to Controllers.
2.  **Testability:** Models can be mocked when testing Controllers.
3.  **Readability:** The Controller flows read like a story ("Get Spot", "Check Overlap", "Create Reservation") rather than a list of SQL commands.

## Implementation Details
*   **Models:** `src/Models/Spot.php`, `src/Models/Reservation.php`, `src/Models/User.php`.
*   **Controllers:** `src/ReservationController.php` depends on Models via Dependency Injection (constructor).
*   **Auth:** `DatabaseAuthProvider` uses `User` Model.
