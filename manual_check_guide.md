# Manual Verification Guide (V1: PHP + React)

## 1. Prerequisites
- Docker Stack Running: `docker compose up --build`
- **No** local Node/NPM servers required.

## 2. Walkthrough Steps

### A. Login Flow
1. Open browser to one of the implementations (e.g., `http://localhost:8081` for V1).
2. Login with `driver1` / `password123`.
3. Verify "Hello, driver1" appears in the header.

### B. View Spots
1. Navigate to "Parking Slots".
2. Verify you see 5 spots (Spot 1, Spot 2, etc.).
3. If they are all green (Available), successful fetch from PHP backend.

### C. Booking Confirmation
1. Click on "Spot 1".
2. Confirm the alert "Booking Successful!".
3. Spot should turn **Red** (Booked) immediately (or after refresh if real-time not set).

### D. Concurrency Check (Manual)
1. Open Incognito window.
2. Login as `driver2` / `password123`.
3. Try to book "Spot 1" (which Driver 1 just booked).
4. **Expected:** Alert "Booking Failed: Spot already booked" (Status 409).

### E. Database Check
Inside the container:
```bash
docker exec -it oktopost-v1-php-1 php -r "echo file_get_contents('http://db:5432/...');" # (Simulated check)
# OR check DB directly:
docker exec -it parking_db psql -U user -d parking -c "SELECT * FROM reservations;"
```
You should see 1 row for Spot 1.
