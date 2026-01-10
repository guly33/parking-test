const WS_BROKER_URL = process.env.WS_BROKER_URL || "http://websocket:8080/broadcast";

export class WSService {
    static async broadcastUpdate(spotId: number, status: string = 'changed') {
        try {
            await fetch(WS_BROKER_URL, {
                method: 'POST',
                body: JSON.stringify({ event: 'update', spot_id: spotId, status })
            });
        } catch (e) {
            console.error("Failed to broadcast update", e);
        }
    }
}
