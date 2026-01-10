import requests

WS_BROKER_URL = "http://websocket:8080/broadcast"

class WebSocketService:
    @staticmethod
    def broadcast_update(spot_id: int):
        try:
            requests.post(WS_BROKER_URL, json={
                "event": "update",
                "spot_id": spot_id,
                "status": "changed"
            }, timeout=1)
        except:
            pass # Fire and forget
