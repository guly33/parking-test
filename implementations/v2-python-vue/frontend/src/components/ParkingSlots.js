import { createApp, ref, onMounted, onUnmounted, watch } from 'vue';
import './ParkingSlots.css';

// --- CONFIGURATION ---
// In a real app, these would come from env
const API_BASE_URL = 'http://localhost:8082';
const WS_URL = `ws://${window.location.hostname}:8080`;

const SLOTS = [
    { label: '08:00 - 12:00', start: 8, end: 12 },
    { label: '12:00 - 16:00', start: 12, end: 16 },
    { label: '16:00 - 20:00', start: 16, end: 20 }
];

export function mount(element) {
    const app = createApp({
        setup() {
            const spots = ref([]);
            const loading = ref(true);
            const error = ref(null);
            const selectedDate = ref(new Date());
            const toasts = ref([]);
            const token = sessionStorage.getItem('token');
            const currentUserId = sessionStorage.getItem('userId');

            // --- Helpers ---
            const removeToast = (id) => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            };

            const showToast = (type, message) => {
                const id = Date.now();
                toasts.value.push({ id, type, message });
                setTimeout(() => removeToast(id), 3000);
            };

            const formatLocalTime = (date) => {
                const pad = (n) => n < 10 ? '0' + n : n;
                const y = date.getFullYear();
                const m = pad(date.getMonth() + 1);
                const d = pad(date.getDate());
                const h = pad(date.getHours());
                const min = pad(date.getMinutes());
                const s = pad(date.getSeconds());
                return `${y}-${m}-${d} ${h}:${min}:${s}`;
            };

            // --- Data Fetching ---
            const fetchSpots = async () => {
                if (!token) return;
                try {
                    const dateStr = selectedDate.value.toLocaleDateString('en-CA');
                    const res = await fetch(`${API_BASE_URL}/api/spots?date=${dateStr}`);
                    if (!res.ok) throw new Error('Failed to fetch');
                    spots.value = await res.json();
                } catch (e) {
                    console.error(e);
                    // Only show error on initial load to avoid flickering on background updates
                    if (loading.value) error.value = e.message;
                } finally {
                    loading.value = false;
                }
            };

            // --- Actions ---
            const handleBook = async (spotId, slot) => {
                const start = new Date(selectedDate.value);
                start.setHours(slot.start, 0, 0, 0);
                const end = new Date(selectedDate.value);
                end.setHours(slot.end, 0, 0, 0);

                try {
                    const res = await fetch(`${API_BASE_URL}/api/reservations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            spot_id: spotId,
                            start_time: formatLocalTime(start),
                            end_time: formatLocalTime(end)
                        })
                    });

                    if (res.status === 201) {
                        showToast('success', 'Booking Successful!');
                        fetchSpots();
                    } else {
                        const err = await res.json();
                        showToast('error', `Failed: ${err.detail}`);
                    }
                } catch (e) {
                    showToast('error', 'Network Error');
                }
            };

            const handleRelease = async (e, reservationId) => {
                e.stopPropagation();
                try {
                    const res = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}/complete`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        showToast('success', "Released!");
                        fetchSpots();
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            // --- Logic for grid ---
            const getSlotState = (spot, slot) => {
                // 1. Find Reservation
                const reservation = spot.reservations.find(r => {
                    const rStart = new Date(r.start_time.replace(' ', 'T'));
                    const rEnd = new Date(r.end_time.replace(' ', 'T'));
                    const startH = rStart.getHours();
                    const endH = rEnd.getHours();
                    return startH < slot.end && endH > slot.start;
                });

                const isBooked = !!reservation;
                const isMySpot = isBooked && String(reservation.user_id) === String(currentUserId);

                // 2. Past Check
                const now = new Date();
                const isToday = selectedDate.value.toDateString() === now.toDateString();
                const isPast = isToday && now.getHours() >= slot.start;

                let stateClass = 'slot-available';
                let text = 'Available';

                if (isPast) {
                    stateClass = 'slot-expired';
                    text = 'Expired';
                } else if (isBooked) {
                    stateClass = isMySpot ? 'slot-booked-mine' : 'slot-booked';
                    text = 'Booked';
                }

                return { stateClass, text, isBooked, isMySpot, isPast, reservation, handleBook, handleRelease };
            };


            // --- Lifecycle ---
            let ws;
            onMounted(() => {
                fetchSpots();
                // Date Listener
                window.addEventListener('parking-date-change', (e) => {
                    selectedDate.value = new Date(e.detail);
                });

                // WebSocket
                const connect = () => {
                    ws = new WebSocket(WS_URL);
                    ws.onopen = () => console.log('[Vue] Connected to Shared Broker');
                    ws.onmessage = (e) => {
                        const data = JSON.parse(e.data);
                        if (data.event === 'update') {
                            console.log(`[Vue] Update Spot #${data.spot_id}`);
                            fetchSpots();
                        }
                    };
                    ws.onclose = () => setTimeout(connect, 3000);
                };
                connect();
            });

            onUnmounted(() => {
                if (ws) ws.close();
            });

            // Watch date to refetch
            watch(selectedDate, () => fetchSpots());

            return {
                spots, loading, error, toasts, SLOTS, getSlotState, removeToast
            };
        },
        template: `
            <div class="vue-slots-container">
                <div class="header-section">
                   <h3>Vue Parking Schedule (V2)</h3>
                </div>

                <div v-if="loading" class="loading-message">Loading...</div>
                <div v-if="error" class="error-message">{{ error }}</div>

                <div v-if="!loading" class="table-responsive">
                    <table class="slots-table">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Spot</th>
                                <th v-for="slot in SLOTS" :key="slot.label" style="text-align: center;">{{ slot.label }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="spot in spots" :key="spot.id">
                                <td class="spot-info">
                                    {{ spot.name }} 
                                    <span class="spot-type">{{ spot.type }}</span>
                                </td>
                                <td v-for="slot in SLOTS" :key="slot.label" class="slot-cell">
                                    <div 
                                        :class="['slot-content', getSlotState(spot, slot).stateClass]"
                                        @click="!getSlotState(spot, slot).isBooked && !getSlotState(spot, slot).isPast && getSlotState(spot, slot).handleBook(spot.id, slot)"
                                    >
                                        <span class="slot-text">{{ getSlotState(spot, slot).text }}</span>
                                        <button 
                                            v-if="getSlotState(spot, slot).isMySpot && !getSlotState(spot, slot).isPast"
                                            @click="(e) => getSlotState(spot, slot).handleRelease(e, getSlotState(spot, slot).reservation.id)"
                                            class="release-btn"
                                        >
                                            Release
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="toast-container">
                    <div 
                        v-for="toast in toasts" 
                        :key="toast.id" 
                        :class="['toast', toast.type]"
                        @click="removeToast(toast.id)"
                        title="Click to dismiss"
                    >
                         {{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.message }}
                    </div>
                </div>
            </div>
        `
    });

    app.mount(element);
    return () => app.unmount();
}
