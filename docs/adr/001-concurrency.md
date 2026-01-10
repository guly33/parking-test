# ADR 001: Concurrency Handling Strategy

## Status
Accepted

## Context
The Smart Parking assignment explicitly requires handling race conditions: *"If two users try to reserve Spot #5 at the exact same millisecond, only one should succeed."*

We need a strategy to guarantee data consistency during concurrent booking requests.

## Decision
We will use **Pessimistic Locking** via Database Transactions.
Specifically, we will use `SELECT ... FOR UPDATE` (or the equivalent SQL standard locking clause) when verifying spot availability.

## Rationale
1.  **Correctness:** Pessimistic locking serializes data access for the specific rows being modified. This is the most robust way to prevent double-booking at the database level, which is the source of truth.
2.  **Simplicity:** While Optimistic Locking (versioning) is more scalable for high-read systems, it requires application-level retry logic. Since our critical path is "Booking Success/Fail", a hard lock that forces the second transaction to wait (and then fail because the status changed) is safer and easier to reason about for this assignment.
3.  **Portability:** This pattern works identically across all our tech stacks (PHP/PDO, Python/SQLAlchemy, Bun/Postgres.js) as long as they leverage the underlying PostgreSQL transaction engine.

## Implementation Details
1.  Begin Transaction.
2.  `SELECT status FROM spots WHERE id = $slot_id FOR UPDATE;` (Locks the resource).
3.  Check if any **Active Reservation** overlaps the requested time range in the `reservations` table.
    *   Query: `SELECT count(*) FROM reservations WHERE spot_id = ? AND status = 'active' AND (start < requested_end AND end > requested_start)`.
4.  If count > 0, Rollback and return Conflict (409).
5.  If count == 0, `INSERT INTO reservations ...`.
6.  Commit Transaction.

