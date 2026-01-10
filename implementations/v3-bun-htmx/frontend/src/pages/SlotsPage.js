import Component from '../core/Component';
import AuthService from '../services/AuthService';
import { getNextDays } from '../services/DateHelper';

export default class SlotsPage extends Component {
  constructor(element, router) {
    super(element);
    this.router = router;
    this.user = AuthService.getCurrentUser();
    this.days = getNextDays(3);

    // Named handler for cleanup
    this.htmxConfigHandler = (evt) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        evt.detail.headers['Authorization'] = `Bearer ${token}`;
      }
    };
  }

  template() {
    const options = this.days.map((day, index) =>
      `<option value="${day.value}" ${index === 0 ? 'selected' : ''}>
         ${day.label} (${day.displayDate})
       </option>`
    ).join('');

    return `
      <div class="animate-enter">
        <div style="position: fixed; bottom: 10px; right: 10px; background: #eab308; color: black; padding: 5px 10px; border-radius: 4px; z-index: 1000; font-weight: bold; font-family: sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          V3: Bun + HTMX
        </div>
        <header>
          <h1>
            <svg class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            SmartParking
          </h1>
          <div class="user-info">
            <span class="user-greeting">Hello, <b>${this.user}</b></span>
            <button id="logout-btn">Log out</button>
          </div>
        </header>

        <main>
          <div class="controls-card">
            <label for="date-select">Booking Date</label>
            <select id="date-select">
              ${options}
            </select>
          </div>

          <div id="parking-slots-view" class="slots-container">
             <div class="placeholder-msg">
                <p>Select a date above to view available slots</p>
                <small style="opacity: 0.6">(Implementation Area)</small>
             </div>
          </div>
        </main>
      </div>
    `;
  }

  afterRender() {
    this.element.querySelector('#logout-btn').addEventListener('click', () => {
      AuthService.logout();
      this.router.navigate('/login');
    });

    const select = this.element.querySelector('#date-select');
    select.addEventListener('change', (e) => {
      const event = new CustomEvent('parking-date-change', { detail: e.target.value });
      window.dispatchEvent(event);
    });

    // --- Integration Point for HTMX (V3) ---
    const container = this.element.querySelector('#parking-slots-view');

    // 1. Load HTMX if not present
    if (!window.htmx) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/htmx.org@1.9.10";
      script.onload = () => {
        // Configure HTMX to send JWT
        document.body.addEventListener('htmx:configRequest', this.htmxConfigHandler);
        loadSpots();
      };
      document.head.appendChild(script);
    } else {
      // Ensure listener is attached even if HTMX was already loaded (e.g. from previous navigation)
      // Clean up old listener first to avoid duplicates if possible? 
      // Simpler: Just add it, as adding same listener func instance is safe, but here it's anonymous.
      // We'll trust the global listener pattern or re-attach. 
      // A safer way for V3 demo:
      document.body.removeEventListener('htmx:configRequest', this.htmxConfigHandler);
      // We need the handler function reference to remove it. 
      // For now, let's just proceed to loadSpots, assuming Auth is global or handled.
      // Actually, let's just re-add it to be safe, idempotency is hard with anonymous functions.
      // We will define a named handler in the class.
      // Re-attach to ensure it's there (idempotent if using same ref? No, different instance per page class)
      // Actually, document.body is global. If we navigate away and back, we add another one.
      // That's why we need to remove it in destroy().
      document.body.addEventListener('htmx:configRequest', this.htmxConfigHandler);
      loadSpots();
    }

    const loadSpots = async () => {
      const date = this.element.querySelector('#date-select').value;
      try {
        container.innerHTML = 'Loading HTMX...';
        const token = sessionStorage.getItem('token');
        const res = await fetch(`http://localhost:8083/api/spots?date=${date}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const html = await res.text();
        container.innerHTML = `
                <table class="w-full" style="border-collapse: separate; border-spacing: 0 8px; width: 100%;">
                    <thead>
                        <tr style="text-align: center; color: #374151; font-weight: 800; font-size: 1.1em;">
                            <th style="padding: 10px; width: 25%; text-align: left;">Spot</th>
                            <th style="padding: 10px; width: 25%;">08:00 - 12:00</th>
                            <th style="padding: 10px; width: 25%;">12:00 - 16:00</th>
                            <th style="padding: 10px; width: 25%;">16:00 - 20:00</th>
                        </tr>
                    </thead>
                    <tbody>${html}</tbody>
                </table>
            `;
        // Tell HTMX to verify the new DOM
        if (window.htmx) {
          window.htmx.process(container);
        } else {
          // Fallback if HTMX not ready? It should be by now.
          console.warn("HTMX not found during process, maybe script failed?");
        }
      } catch (e) {
        console.error("V3 Load Error:", e);
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444;">
            <p><strong>Connection Error</strong></p>
            <p style="font-size: 0.9em; opacity: 0.8;">Could not load parking slots from V3 Backend.</p>
            <button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">Retry</button>
        </div>`;
      }
    };

    // Re-load on date change
    this.refreshListener = () => loadSpots();
    window.addEventListener('parking-date-change', this.refreshListener);

    // Connect WS (Shared Broker) for Auto-Refresh
    this.ws = new WebSocket('ws://localhost:8080');
    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'update') loadSpots();
    };
  }

  destroy() {
    if (this.refreshListener) {
      window.removeEventListener('parking-date-change', this.refreshListener);
      this.refreshListener = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      if (this.htmxConfigHandler) {
        document.body.removeEventListener('htmx:configRequest', this.htmxConfigHandler);
      }
    }
    // Note: HTMX listeners on body/document might persist, but checking for auth config
    // is usually global. We might want to remove specific listeners if we added them to specific elements,
    // but the one in afterRender is on document.body. For now, this is acceptable as it's idempotent-ish.
  }
} 