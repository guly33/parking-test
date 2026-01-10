import { createApp, ref, onMounted, onUnmounted, watch } from 'vue';

const SLOTS = [
    { label: '08:00 - 12:00', start: 8, end: 12 },
    { label: '12:00 - 16:00', start: 12, end: 16 },
    { label: '16:00 - 20:00', start: 16, end: 20 }
];

export function mount(element) {
    createApp({
        setup() {
            const spots = ref([]);
            const loading = ref(true);
            const error = ref(null);
            const selectedDate = ref(new Date());
            const toasts = ref([]);
            const token = sessionStorage.getItem('token');
            const currentUserId = sessionStorage.getItem('userId');

            // --- Helpers ---
            const showToast = (type, message) => {
                const id = Date.now();
                toasts.value.push({ id, type, message });
                setTimeout(() => {
                    toasts.value = toasts.value.filter(t => t.id !== id);
                }, 3000);
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
                try {
                    const dateStr = selectedDate.value.toLocaleDateString('en-CA');
                    const res = await fetch(`http://localhost:8082/api/spots?date=${dateStr}`);
                    if (!res.ok) throw new Error('Failed to fetch');
                    spots.value = await res.json();
                } catch (e) {
                    console.error(e);
                    error.value = e.message;
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
                    const res = await fetch('http://localhost:8082/api/reservations', {
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
                    const res = await fetch(`http://localhost:8082/api/reservations/${reservationId}/complete`, {
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
                    // Note: Python output might need datetime handling or we assume string ISO-ish
                    // V1 used "YYYY-MM-DD HH:mm:ss"

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

                let bg = '#4caf50';
                let text = 'Available';
                let cursor = 'pointer';

                if (isPast) {
                    bg = '#cccccc'; text = 'Expired'; cursor = 'not-allowed';
                } else if (isBooked) {
                    bg = isMySpot ? '#d32f2f' : 'grey';
                    text = 'Booked';
                    cursor = isMySpot ? 'default' : 'not-allowed';
                }

                return { bg, text, cursor, isBooked, isMySpot, isPast, reservation, handleBook, handleRelease };
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
                    ws = new WebSocket(`ws://${window.location.hostname}:8080`);
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
                spots, loading, error, toasts, SLOTS, getSlotState
            };
        },
        template: `
            <div style="padding: 20px; border: 1px solid #ccc; font-family: sans-serif;">
                <div style="margin-bottom: 15px;">
                   <h3>Vue Parking Schedule (V2)</h3>
                </div>

                <div v-if="loading">Loading...</div>
                <div v-if="error" style="color:red">{{ error }}</div>

                <div v-if="!loading" style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Spot</th>
                                <th v-for="slot in SLOTS" :key="slot.label" style="padding: 10px; border-bottom: 2px solid #ddd;">{{ slot.label }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="spot in spots" :key="spot.id" style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold;">{{ spot.name }} <br><small>{{ spot.type }}</small></td>
                                <td v-for="slot in SLOTS" :key="slot.label" style="padding: 4px;">
                                    <div :style="{
                                        backgroundColor: getSlotState(spot, slot).bg,
                                        color: 'white',
                                        padding: '4px',
                                        textAlign: 'center',
                                        borderRadius: '4px',
                                        cursor: getSlotState(spot, slot).cursor,
                                        opacity: getSlotState(spot, slot).isPast ? 0.6 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '60px'
                                    }"
                                    @click="!getSlotState(spot, slot).isBooked && !getSlotState(spot, slot).isPast && getSlotState(spot, slot).handleBook(spot.id, slot)">
                                        <span style="font-weight: bold;">{{ getSlotState(spot, slot).text }}</span>
                                        <button v-if="getSlotState(spot, slot).isMySpot && !getSlotState(spot, slot).isPast"
                                            @click="(e) => getSlotState(spot, slot).handleRelease(e, getSlotState(spot, slot).reservation.id)"
                                            style="margin-top: 4px; cursor: pointer; background: white; color: #d32f2f; border: none; border-radius: 4px; padding: 2px 8px; font-size: 0.8em; font-weight: bold;">
                                            Release
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="toast-container">
                    <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
                        {{ toast.message }}
                    </div>
                </div>
            </div>
        `
    }).mount(element);
}
