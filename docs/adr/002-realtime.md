# ADR 002: Real-Time Update Protocol

## Status
Accepted

## Context
The system must update the UI instantly when a spot is booked or released. We need a real-time communication protocol.

## Decision
We will use a **Standalone Shared WebSocket Service** built with **Bun**.

## Rationale
1.  **Unified Architecture:** Instead of implementing 3 different WebSocket handlers (PHP/Ratchet, Python/FastAPI-WS, Bun/WS), we use one high-performance microservice.
2.  **Decoupling:** Backends (Producers) only need to make a simple HTTP POST request. They don't need to manage persistent connections.
3.  **Performance:** Bun's native WebSocket implementation is highly efficient.

## Implementation Details
*   **Service:** `services/websocket` (Bun) listening on port `8080`.
*   **Protocol:**
    *   **WS:** `ws://host:8080` (Clients subscribe to global topic 'parking').
    *   **HTTP:** `POST http://host:8080/broadcast` (Backends publish updates).
    *   **Payload:** `{ "event": "update", "spot_id": 1, "status": "reserved" }`.
*   **Flow:** User Books -> Backend DB Commit -> Backend POSTs to WS Service -> WS Service Broadcasts to All Clients.
