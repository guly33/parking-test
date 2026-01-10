import React from 'react';
import ReactDOM from 'react-dom/client';
import Slots from './components/ParkingSlots';

export function mountParkingSlots(element) {
    const root = ReactDOM.createRoot(element);
    root.render(
        <React.StrictMode>
            <Slots />
        </React.StrictMode>
    );
    return () => root.unmount();
}
