import React, { useState, useEffect, useRef, useCallback } from 'react';

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

    const showToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const token = sessionStorage.getItem('token');
    const currentUserId = sessionStorage.getItem('userId');

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

    const fetchSpots = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            // Send YYYY-MM-DD (Local)
            const dateStr = selectedDate.toLocaleDateString('en-CA');
            const res = await fetch(`http://localhost:8081/api/spots?date=${dateStr}`);
            if (!res.ok) throw new Error('Failed to fetch spots');
            const data = await res.json();
            setSpots(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]); // Recreates when date changes

    // Keep a ref to the latest fetchSpots to avoid WS reconnects
    const fetchSpotsRef = useRef(fetchSpots);
    useEffect(() => {
        fetchSpotsRef.current = fetchSpots;
    }, [fetchSpots]);

    useEffect(() => {
        fetchSpots();
        const interval = setInterval(fetchSpots, 5000);
        return () => clearInterval(interval);
    }, [fetchSpots]);

    // WebSocket Integration (ADR 002)
    useEffect(() => {
        let ws;
        let reconnectTimer;

        const connect = () => {
            ws = new WebSocket(`ws://${window.location.hostname}:8080`);

            ws.onopen = () => {
                console.log('[WS] Connected to Shared Broker');
                showToast('success', 'Realtime Connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'update') {
                        console.log(`[WS] Update received for Spot #${data.spot_id}`);
                        // Use ref to call the CURRENT fetchSpots closure with correct date
                        if (fetchSpotsRef.current) {
                            fetchSpotsRef.current();
                        }
                    }
                } catch (e) {
                    console.error('[WS] Parse error', e);
                }
            };

            ws.onclose = () => {
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
            if (ws) ws.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []); // Empty dep array: Connect ONCE. Use refs for dynamic logic.

    // Helper to format Date to YYYY-MM-DD HH:mm:ss (Local)
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
        // Construct Start/End Time based on Selected Date and Slot Hours
        const start = new Date(selectedDate);
        start.setHours(slot.start, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(slot.end, 0, 0, 0);

        try {
            const res = await fetch('http://localhost:8081/api/reservations', {
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
            const res = await fetch(`http://localhost:8081/api/reservations/${reservationId}/complete`, {
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

    if (loading) return <div>Loading Slots...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="react-slots-container" style={{ padding: '20px', border: '1px solid #ccc' }}>
            <div style={{ marginBottom: '15px' }}>
                <h3>Parking Schedule (5 Spots x 3 Slots)</h3>
                <p>Date: {selectedDate.toDateString()}</p>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' }}>Spot</th>
                            {SLOTS.map(slot => (
                                <th key={slot.label} style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>
                                    {slot.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {spots.map(spot => (
                            <tr key={spot.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{spot.name} <br /> <small>{spot.type}</small></td>
                                {SLOTS.map(slot => {
                                    // 1. Check for Overlap (Active Reservation)
                                    const reservation = spot.reservations.find(r => {
                                        const rStart = new Date(r.start_time.replace(' ', 'T'));
                                        const rEnd = new Date(r.end_time.replace(' ', 'T'));

                                        // Convert to hours for simple int comparison against fixed slots
                                        // Optimization: We assume same-day reservations based on backend query
                                        const startH = rStart.getHours();
                                        const endH = rEnd.getHours();

                                        // Overlap: (Start < SlotEnd) and (End > SlotStart)
                                        return startH < slot.end && endH > slot.start;
                                    });

                                    const isBooked = !!reservation;
                                    const isMySpot = isBooked && String(reservation.user_id) === String(currentUserId);

                                    // 2. Check for Past Slots
                                    const now = new Date();
                                    // Check if selectedDate is "Today" (ignoring time)
                                    const isToday = selectedDate.toDateString() === now.toDateString();
                                    // Strict Past Logic: If current hour >= Slot Start, it's unavailable/started.
                                    const isPast = isToday && now.getHours() >= slot.start;

                                    // 3. Determine Style
                                    let bg = '#4caf50'; // Green (Available)
                                    let text = 'Available';
                                    let cursor = 'pointer';

                                    if (isPast) {
                                        bg = '#cccccc'; // Grey (Expired)
                                        text = 'Expired';
                                        cursor = 'not-allowed';
                                    } else if (isBooked) {
                                        bg = isMySpot ? '#d32f2f' : 'grey'; // Red or Grey
                                        text = 'Booked';
                                        cursor = isMySpot ? 'default' : 'not-allowed'; // Only own spots are interactive (release)
                                    }

                                    return (
                                        <td key={slot.label} className="slot-cell" style={{ padding: '4px' }}>
                                            <div
                                                className="slot-content"
                                                onClick={() => !isBooked && !isPast && handleBook(spot.id, slot)}
                                                style={{
                                                    backgroundColor: bg,
                                                    color: 'white',
                                                    cursor: cursor,
                                                    opacity: isPast ? 0.6 : 1
                                                }}
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
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                ))}
            </div>
        </div >
    );
};

export default Slots;
