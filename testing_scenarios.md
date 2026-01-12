# Parking System - Manual Testing Scenarios

This document outlines the key scenarios to verify the correctness, concurrency safety, and real-time features of the Parking System across all three stacks (PHP, Python, Bun).

## 1. Basic Functionality (Single User)
**Goal**: Verify core CRUD operations work for a single user.

- [ ] **Login**:
  - Open V1 (http://localhost:8081). Login as `test` (User ID 1). Verify "Hello, test".
  - Open V2 (http://localhost:8082). Login as `driver1` (User ID 2). Verify "Hello, driver1".
  - Open V3 (http://localhost:8083). Login as `driver2` (User ID 3). Verify "Hello, driver2".
- [ ] **View Spots**:
  - Select "Today" in the date picker.
  - Verify 3 slots (08-12, 12-16, 16-20) are visible for all spots.
  - Verify "Expired" status for past slots (if applicable based on current time).
- [ ] **Book a Spot**:
  - Click an "Available" slot (Green).
  - Verify it turns "Booked" (Red).
  - Verify it shows "Booked" (Red) on refresh.
  - **Cross-Stack Check**: Book on V1. Refresh V2 and V3. The same slot should be Red.
- [ ] **Release a Spot**:
  - Click "Release" on a slot you booked (Red with Release button).
  - Verify it becomes "Available" (Green).
  - **Cross-Stack Check**: Release on V1. Refresh V2 and V3. The slot should be Green.

## 2. Real-Time Updates (WebSockets)
**Goal**: Verify that actions in one browser/stack instantly update others without refresh.

- [ ] **Setup**: Open two windows side-by-side.
  - Window A: V1 (PHP) logged in as `test`.
  - Window B: V2 (Python) logged in as `driver1`.
- [ ] **Live Booking**:
  - In Window A, book Spot 1 (08-12).
  - **Expectation**: Window B should *instantly* flip that slot to "Booked" (Grey/Red) without user interaction.
- [ ] **Live Release**:
  - In Window A, release the spot.
  - **Expectation**: Window B should *instantly* flip that slot to "Available" (Green).
- [ ] **V3 Check**:
  - Open Window C: V3 (Bun).
  - Repeat booking in A. Expect updates in B *and* C.

## 3. Concurrency Safety (The "Gauntlet")
**Goal**: Verify that two users cannot book the same spot simultaneously (Double Booking prevention).

- [ ] **Setup**:
  - Open V1 (Chrome) as `test`.
  - Open V2 (Firefox or separate window) as `driver1`.
  - locate the *same* available slot (e.g., The Dock, 12:00-16:00).
- [ ] **Manual Race**:
  - Position cursors over the "Available" button on both screens.
  - Click both buttons as close to simultaneously as possible.
- [ ] **Expectation**:
  - **One user** should see a "Success" toast/message.
  - **The other user** should see an "Error" toast (e.g., "Spot already reserved" or "Conflict").
  - The slot should end up booked by the winner.
  - **Failure Condition**: Both users get "Success", or the slot remains available (though unlikely).
  
- [ ] **Automated Gauntlet**:
  - Run the automated concurrency test:
    ```bash
    node tests/concurrency_test.js v1
    # or v2, v3
    ```
  - **Expectation**: "✅ PASS: Concurrency handled correctly." (1 Success, 19 Conflicts).



## 4. Input Validation & Security
**Goal**: Verify the system rejects invalid or malicious inputs.

- [ ] **Past Booking**:
  - Try to interact with a slot from yesterday (if UI allows picking old dates).
  - Or manually send a POST request with a past date.
  - **Expectation**: 400 Bad Request ("Cannot book in the past").
- [ ] **Overlap Booking**:
  - Manually send a POST request for a time range that partially overlaps an existing reservation (e.g., 09:00 - 11:00 when 08:00 - 12:00 is booked).
  - **Expectation**: 409 Conflict.

## 5. Persistence
**Goal**: Verify data survives container restarts.

- [ ] **Analytics Check**:
  - Visit `http://localhost:8081/api/stats` (V1)
  - Visit `http://localhost:8082/api/stats` (V2)
  - Visit `http://localhost:8083/api/stats` (V3)
  - **Expectation**: All return a JSON array like `[{"hour": 8, "count": 12}, ...]`.

- [ ] **Action**:
  - Book a few spots.

- [ ] **Action**:
  - Book a few spots.
  - Run `docker compose restart db`.
  - Refresh pages.
- [ ] **Expectation**: All reservations are still present.

## 6. Logging Verification
**Goal**: Verify logs are written to files.

- [ ] **Action**:
  - Perform a few login, booking, and release actions.
  - Run the following commands to check logs inside containers:
    ```bash
    # V1 PHP
    sudo docker exec oktopost-v1-php-1 cat /var/www/html/server.log
    
    # V2 Python
    sudo docker exec oktopost-v2-python-1 cat /app/server.log
    
    # V3 Bun
    sudo docker exec oktopost-v3-bun-1 cat /app/server.log
    
    # WebSocket
    sudo docker exec parking_websocket cat /app/server.log
    ```
- [ ] **Expectation**: All files should contain recent, timestamped logs of your actions.
