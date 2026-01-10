# ADR 007: UI Notifications

## Status
Accepted

## Context
The initial prototype used `window.alert()` and `window.confirm()`. These interrupt the user flow and cannot be styled to match the premium aesthetic.

## Decision
We will use **Non-blocking Toast Notifications**.

## Rationale
1.  **UX**: User can continue interacting with the app while reading the status message.
2.  **Aesthetics**: Toasts are styled with CSS animations (`slideIn`) and semantic colors (Green/Red).
3.  **Efficiency**: Eliminates the extra click required to dismiss an alert.

## Implementation Details
*   **Component:** `ParkingSlots.jsx` manages a `toasts[]` state array.
*   **Helper:** `showToast(type, message)` function appends to state and sets a timeout for auto-dismissal (3s).
*   **Rendering:** Fixed-position `div.toast-container` renders the list of active toasts.
