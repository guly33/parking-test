import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './ParkingSlots.css';

// --- CONFIGURATION ---
// In a real app, these would come from import.meta.env
const API_BASE_URL = 'http://localhost:8081';
const WS_URL = `ws://${window.location.hostname}:8080`;

const SLOTS = [
    { label: '08:00 - 12:00', start: 8, end: 12 },
    { label: '12:00 - 16:00', start: 12, end: 16 },
    { label: '16:00 - 20:00', start: 16, end: 20 }
];

const Slots = () => {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [toasts, setToasts] = useState([]);

    // Memoize auth data to avoid reading sessionStorage on every render
    const { token, currentUserId } = useMemo(() => ({
        token: sessionStorage.getItem('token'),
        currentUserId: sessionStorage.getItem('userId')
    }), []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    // --- EVENT LISTENERS ---
    useEffect(() => {
        const handleDateChange = (e) => {
            const d = new Date(e.detail);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
            }
        };
        window.addEventListener('parking-date-change', handleDateChange);
        return () => window.removeEventListener('parking-date-change', handleDateChange);
    }, []);

    // --- DATA FETCHING ---
    const fetchSpots = useCallback(async () => {
        if (!token) return;

        try {
            // Send YYYY-MM-DD (Local) - Note: Be careful with timezone shifts here
            const dateStr = selectedDate.toLocaleDateString('en-CA');
            const res = await fetch(`${API_BASE_URL}/api/spots?date=${dateStr}`);
            if (!res.ok) throw new Error('Failed to fetch spots');
            const data = await res.json();
            setSpots(data);
        } catch (err) {
            console.error(err);
            // Don't set global error state on background refreshes unless it's the first load
            if (loading) setError('Failed to load parking spots');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, token, loading]);

    // Ref for WS to call latest fetchSpots
    const fetchSpotsRef = useRef(fetchSpots);
    useEffect(() => {
        fetchSpotsRef.current = fetchSpots;
    }, [fetchSpots]);

    // Initial Fetch & Polling (Fallback)
    useEffect(() => {
        fetchSpots();
        // Poll every 10s as a fallback, or if WS fails
        const interval = setInterval(fetchSpots, 10000);
        return () => clearInterval(interval);
    }, [fetchSpots]);

    // --- WEBSOCKET ---
    useEffect(() => {
        let ws;
        let reconnectTimer;
        let isUnmounted = false;

        const connect = () => {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log('[WS] Connected to Shared Broker');
                if (!isUnmounted) showToast('success', 'Realtime Connected');
            };

            ws.onmessage = (event) => {
                if (isUnmounted) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'update') {
                        console.log(`[WS] Update received for Spot #${data.spot_id}`);
                        if (fetchSpotsRef.current) fetchSpotsRef.current();
                    }
                } catch (e) {
                    console.error('[WS] Parse error', e);
                }
            };

            ws.onclose = () => {
                if (isUnmounted) return;
                console.log('[WS] Disconnected. Reconnecting...');
                reconnectTimer = setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                console.warn('[WS] Error:', err);
                ws.close();
            };
        };

        connect();

        return () => {
            isUnmounted = true;
            if (ws) ws.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [showToast]);

    // --- ACTIONS ---
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

    const handleBook = async (spotId, slot) => {
        const start = new Date(selectedDate);
        start.setHours(slot.start, 0, 0, 0);

        const end = new Date(selectedDate);
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
                showToast('error', `Booking Failed: ${err.error}`);
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
                showToast('success', "Spot Released!");
                fetchSpots();
            } else {
                showToast('error', "Failed to release spot");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && spots.length === 0) return <div className="loading-message">Loading Slots...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="react-slots-container">
            <div className="header-section">
                <h3>Parking Schedule (5 Spots x 3 Slots)</h3>
                <p>Date: {selectedDate.toDateString()}</p>
            </div>

            <div className="table-responsive">
                <table className="slots-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Spot</th>
                            {SLOTS.map(slot => (
                                <th key={slot.label} style={{ textAlign: 'center' }}>
                                    {slot.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {spots.map(spot => (
                            <tr key={spot.id}>
                                <td className="spot-info">
                                    {spot.name}
                                    <span className="spot-type">{spot.type}</span>
                                </td>
                                {SLOTS.map(slot => {
                                    // 1. Check for Overlap
                                    const reservation = spot.reservations.find(r => {
                                        const rStart = new Date(r.start_time.replace(' ', 'T'));
                                        const rEnd = new Date(r.end_time.replace(' ', 'T'));
                                        return rStart.getHours() < slot.end && rEnd.getHours() > slot.start;
                                    });

                                    const isBooked = !!reservation;
                                    const isMySpot = isBooked && String(reservation.user_id) === String(currentUserId);

                                    // 2. Check for Past Slots
                                    const now = new Date();
                                    const isToday = selectedDate.toDateString() === now.toDateString();
                                    const isPast = isToday && now.getHours() >= slot.start;

                                    // 3. Determine Class
                                    let slotClass = 'slot-available';
                                    let text = 'Available';

                                    if (isPast) {
                                        slotClass = 'slot-expired';
                                        text = 'Expired';
                                    } else if (isBooked) {
                                        slotClass = isMySpot ? 'slot-booked-mine' : 'slot-booked';
                                        text = 'Booked';
                                    }

                                    return (
                                        <td key={slot.label} className="slot-cell">
                                            <div
                                                className={`slot-content ${slotClass}`}
                                                onClick={() => !isBooked && !isPast && handleBook(spot.id, slot)}
                                            >
                                                <span className="slot-text">{text}</span>
                                                {isBooked && isMySpot && !isPast && (
                                                    <button
                                                        className="release-btn"
                                                        onClick={(e) => handleRelease(e, reservation.id)}
                                                    >
                                                        Release
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type}`}
                        onClick={() => removeToast(toast.id)}
                        title="Click to dismiss"
                    >
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Slots;
