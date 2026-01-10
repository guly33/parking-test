# Verification Plan (V1: PHP + React)

## 1. Automated Tests
- [ ] **Concurrency:** `node tests/concurrency_test.js` (Must have 0 conflicts, 1 success).
- [ ] **Stats:** `curl http://localhost:8081/api/stats` (Should return JSON).

## 2. Manual Verification
- [ ] **Login:** Driver1 can login.
- [ ] **Booking:** Spot turns Red upon booking.
- [ ] **Stale Check:** Book a spot for 1 hour ago (via DB manipulation), run stale checker, spot becomes Green.
- [ ] **Date Filter:** Changing date in UI updates spot availability.

## 3. Infrastructure
- [ ] **Migrations:** `dbmate` runs successfully on startup.
- [ ] **Logs:** No PHP Fatal Errors in `docker compose logs`.
