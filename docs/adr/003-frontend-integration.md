# ADR 003: Frontend Integration Strategy

## Status
Accepted

## Context
We must integrate React (V1), Vue (V2), and HTMX (V3) components into an existing Vanilla JS SPA without checking in a new repo or rewriting the router.

## Decision
We will use **Direct DOM Mounting** at the component level.

## Rationale
The existing app uses a simple `class Component` structure where each page has a `template()` and `afterRender()`.
We will treat the frameworks as "Widgets" that mount into a specific `div` during the `afterRender()` lifecycle hook.

## Implementation Details
*   **V1 (React):** Use `createRoot(document.getElementById('parking-slots-view')).render(<App />)` inside `SlotsPage.afterRender`.
*   **V2 (Vue):** Use `createApp(App).mount('#parking-slots-view')` inside `SlotsPage.afterRender`.
*   **V3 (HTMX):** Inject HTML with `hx-` attributes into the innerHTML of the container and call `htmx.process()` to activate bindings.

This ensures the "wrapper" (Auth, Navigation, Header) remains Vanilla JS, fulfilling the assignment constraint.
