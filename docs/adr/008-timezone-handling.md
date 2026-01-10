# ADR 008: Timezone Handling

## Status
Accepted

## Context
The Parking application is typically deployed for a specific physical location (e.g., an office building). Users expect "Today" to match the local wall-clock time of that location, not UTC. Using UTC (`gmdate`) caused UI discrepancies where bookings made late in the day (local time) appeared on the "next day" or vice versa due to timezone shifts.

## Decision
We will use **Server Local Time** (System Time) for all booking logic.

## Rationale
1.  **Simplicity**: `date('Y-m-d')` aligns with the server's configured timezone. A container's timezone can be set via env var `TZ` if needed, instantly localizing the logic without code changes.
2.  **consistency**: The Date Picker in the frontend sends `YYYY-MM-DD` (Local). The backend interprets this as `YYYY-MM-DD 00:00:00` (Local). This avoids conversion errors.
3.  **Scope**: For a single-location parking system, "Local Time" is the correct business domain time.

## Implementation Details
*   **PHP:** Use `date()` instead of `gmdate()`.
*   **Frontend:** Construct date strings without 'Z' (UTC) suffix, ensuring Backend interprets them as local.
