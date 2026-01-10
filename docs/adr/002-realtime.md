# ADR 002: Real-Time Update Protocol

## Status
Accepted

## Context
The system must update the UI instantly when a spot is booked or released. We need a real-time communication protocol.

## Decision
We will use **WebSockets**.

## Rationale
1.  **Requirement:** The PDF explicitly mentions *"Implement a WebSocket server (using native WS, Socket.io, or similar)"*.
2.  **Bi-directional:** While Server-Sent Events (SSE) would be sufficient for server-to-client updates, following the spec's terminology avoids ambiguity during evaluation.
3.  **Latency:** WebSockets offer the lowest latency for high-frequency updates.

## Implementation Details
*   **Events:**
    *   `spot_update`: Payload `{ spot_id: 1, status: 'booked' }`
*   **Broadcast:** The server will broadcast this event to all connected clients immediately after a successful DB transaction for booking/release.
