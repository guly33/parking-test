# Smart Parking System (Multi-Stack Implementation)

This repository contains three distinct implementations of the Smart Parking system, demonstrating full-stack versatility and adherence to strict concurrency and design constraints.

## 🚀 Implementations

| Variant | Backend | Frontend | Status | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **V1** | **PHP** (Native MVC) | **React** | ✅ **Complete** | Standard SPA integration, JWT Auth, Dockerized |
| **V2** | **Python** (FastAPI) | **Vue** | ✅ **Complete** | MVC Refactored, Shared WS Integrated |
| **V3** | **Bun** (Elysia/Native) | **HTMX** | ✅ **Complete** | Hyper-fast Server-Driven UI, Server-Side SPA |

## 🛠️ Setup & Execution

The entire suite is orchestrated via Docker Compose.

```bash
# Start all variants and database
docker-compose up --build
```

Access the applications at:
- **V1 (PHP + React):** http://localhost:8081
- **V2 (Python + Vue):** http://localhost:8082
- **V3 (Bun + HTMX):** http://localhost:8083

> **Note:** All frontends are now served directly by their respective backends via Docker. No separate `npm run dev` is required!

### 🔑 Test Credentials
- **Username:** `driver1`, `driver2`, `test`
- **Password:** `password123`, `password123`, `test`

### 🏷️ Version Indicators
Each frontend has a color-coded badge in the **bottom-right corner** to help you distinguish between implementations:
- 🔵 **V1 (PHP):** Blue
- 🟢 **V2 (Python)::** Green
- 🟡 **V3 (Bun):** Yellow

## 🏗️ Architecture
 
 ```mermaid
 graph TD
     subgraph Clients
         C1[React Client]
         C2[Vue Client]
         C3[HTMX Client]
     end
     
     subgraph Backends
         P[V1: PHP :8081]
         Py[V2: Python :8082]
         B[V3: Bun :8083]
     end
 
     subgraph Shared Services
         DB[("PostgreSQL :5435")]
         WS["WebSocket Broker :8080"]
         W["Stale Checker (PHP)"]
     end
 
     C1 -->|HTTP| P
     C2 -->|HTTP| Py
     C3 -->|HTTP| B
     
     C1 -.->|WS| WS
     C2 -.->|WS| WS
     C3 -.->|WS| WS
 
     P -->|SQL| DB
     Py -->|SQL| DB
     B -->|SQL| DB
     W -->|SQL| DB
 
     P -->|Broadcast| WS
     Py -->|Broadcast| WS
     B -->|Broadcast| WS
     W -->|Broadcast| WS
 ```
 
 ### Shared Services
 1.  **WebSocket Broker (Port 8080):** A standalone Bun service that handles real-time updates for *all* implementations.
     -   **Protocol:** Backends send POST requests to `http://websocket:8080/broadcast`. Clients listen on `ws://localhost:8080`.
 2.  **Stale Checker (Background Worker):**
     -   **Script:** `scripts/stale_checker.php` running in a sidecar container.
     -   **Functionality:** Runs every 60s. Checks the **shared database** for expired reservations (`end_time < NOW()`) that are still `active`.
     -   **Scope:** Releases spots for **ALL** users (V1, V2, V3) and notifies the WebSocket broker.
 
 ### Concurrency Handling (ADR 001)
 To satisfy the requirement *"If two users try to reserve Spot #5 at the exact same millisecond, only one should succeed"*, all implementations utilize **Database-Level Locking**.
 
 ```mermaid
 sequenceDiagram
     participant Client
     participant Backend
     participant DB
 
     Client->>Backend: POST /reservations
     Backend->>DB: BEGIN TRANSACTION
     Backend->>DB: SELECT ... FROM spots FOR UPDATE
     Note right of DB: Row Locked 🔒
     Backend->>DB: SELECT ... FROM reservations (Overlap Check)
     alt Spot Occupied
         Backend->>DB: ROLLBACK
         Backend-->>Client: 409 Conflict
     else Spot Free
         Backend->>DB: INSERT INTO reservations
         Backend->>DB: COMMIT
         Note right of DB: Lock Released 🔓
         Backend-->>Client: 201 Created
     end
 ```
 
 - **Mechanism:** `SELECT ... FOR UPDATE` (Pessimistic Locking).
 - **Why?** Guarantees serializability at the database level, the single source of truth.
 
 ### Timezone Handling (ADR 008)
 - **Decision:** **Server Local Time** is used for all logic.
 - **Why?** Simplifies "Booking for Today" logic for a physical location.

## ⏱️ Estimation vs Actual
 
 | Comp. | Estimated | Actual | Notes |
 | :--- | :--- | :--- | :--- |
 | **Shared Infra** | 2h | 2.5h | Docker Setup, PostgreSQL, Scaffolding, WebSocket Broker |
 | **V1 (PHP)** | 2h | 1.5h | Core logic implementation & React setup |
 | **V2 (Python)** | 3h | 1h | Ported logic from V1, very efficient |
 | **V3 (Bun)** | 2h | 2h | Learning curve for Bun/HTMX & static hosting fixes |
 | **Total**| **9h** | **7h** | Completed within one working day. |
 
 ## 🧠 Assumptions
1.  **Auth:** We use a Custom `User` Entity (ADR 006) capable of supporting future OIDC providers, but currently using seeded users (`driver1`, `driver2`, `test`).
2.  **Persistence:** Docker volumes (`pgdata`) persist PostgreSQL data.

## 🧪 Testing & Verification
For a complete list of test cases, including manual concurrency races and logging verification, please refer to [Testing Scenarios](testing_scenarios.md).
A Node.js script is provided to stress-test the concurrency logic.

```bash
# Test V1 (PHP)
node tests/concurrency_test.js v1

# Test V2 (Python)
node tests/concurrency_test.js v2

# Test V3 (Bun)
node tests/concurrency_test.js v3
```
The expected result for **each** is **1 Success** and **19 Conflicts** (safe failures).
