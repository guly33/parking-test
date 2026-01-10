# Smart Parking System (Multi-Stack Implementation)

This repository contains three distinct implementations of the Smart Parking system, demonstrating full-stack versatility and adherence to strict concurrency and design constraints.

## 🚀 Implementations

| Variant | Backend | Frontend | Status | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **V1** | **PHP** (Native MVC) | **React** | ✅ **Complete** | Standard SPA integration, JWT Auth, Dockerized |
| **V2** | **Python** (FastAPI) | **Vue** | ✅ **Active** | MVC Refactored, Shared WS Integrated |
| **V3** | **Bun** (Elysia) | **HTMX** | 🚧 Pending | Hyper-fast Server-Driven UI |

## 🛠️ Setup & Execution

The entire suite is orchestrated via Docker Compose.

```bash
# Start all variants and database
docker-compose up --build
```

Access the applications at:
- **V1 (PHP):** http://localhost:8081
- **V2 (Python):** http://localhost:8082 (API) / http://localhost:5174 (Dev Frontend)
- **V3 (Bun):** http://localhost:8083

## 🏗️ Architecture Decisions

### Concurrency Handling (ADR 001)
To satisfy the requirement *"If two users try to reserve Spot #5 at the exact same millisecond, only one should succeed"*, all implementations utilize **Database-Level Locking**.
- **Mechanism:** `SELECT ... FOR UPDATE` (Pessimistic Locking) inside a transaction.
- **Logic:** Lock the Spot -> Check for Overlapping Reservations -> Insert if Clear -> Commit.
- **Why?** Guarantees serializability for the critical "booking" action, effectively eliminating race conditions at the database (the source of truth).

### Real-Time Updates (ADR 002)
- **Status:** ✅ **Active** (Integrated with V1 & V2)
- **Architecture:** A **Standalone Bun Service** (`services/websocket`) acts as a dedicated message broker running on port `8080`.
- **Flow:**
    1.  **Backend (PHP/Python):** Pushes update to `http://websocket:8080/broadcast`.
    2.  **Broker:** Broadcasts message to all connected clients.
    3.  **Frontend (React/Vue/HTMX):** Listens on `ws://localhost:8080` and triggers a refresh.

### Background Worker ("The Stale Checker")
- A PHP script (`scripts/stale_checker.php`) runs every 60 seconds via a Docker sidecar container.
- **Role:** Releases slots where `end_time < NOW()` and `status = 'active'`.

### Timezone Handling (ADR 008)
- **Decision:** **Server Local Time** is used for all logic.
- **Why?** Simplifies "Booking for Today" logic for a physical location-based service and prevents "off-by-one day" UI bugs common with UTC-to-Local conversions in simple date pickers.

## 🧠 Assumptions
1.  **Auth:** We use a Custom `User` Entity (ADR 006) capable of supporting future OIDC providers, but currently using seeded users (`driver1`, `driver2`, `test`).
2.  **Persistence:** Docker volumes (`pgdata`) persist PostgreSQL data.

## 🧪 Testing & Verification
A Node.js script is provided to stress-test the concurrency logic.

```bash
# Run Concurrency Stress Test (20 parallel requests)
node tests/concurrency_test.js
```
The expected result is **1 Success** and **19 Conflicts** (safe failures).
