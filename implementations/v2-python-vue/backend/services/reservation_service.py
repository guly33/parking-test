import datetime
from fastapi import HTTPException
from entities.spot import Spot
from entities.reservation import Reservation
from services.ws_service import WebSocketService

class ReservationService:
    def __init__(self, conn):
        self.conn = conn
        self.spot_entity = Spot(conn)
        self.res_entity = Reservation(conn)

    def get_spots_with_reservations(self, date_str: str = None):
        if not date_str:
            date_str = datetime.date.today().isoformat()
        
        start_day = f"{date_str} 00:00:00"
        end_day = f"{date_str} 23:59:59"

        spots = self.spot_entity.get_all()
        reservations = self.res_entity.get_active_in_range(start_day, end_day)
        
        # Merge
        for spot in spots:
            spot['reservations'] = [dict(r) for r in reservations if r['spot_id'] == spot['id']] 

        return spots

    def create_reservation(self, user_id: int, spot_id: int, start_time: str, end_time: str):
        # Validate Time
        start_dt = datetime.datetime.fromisoformat(start_time)
        if start_dt < datetime.datetime.now() - datetime.timedelta(minutes=5):
            raise HTTPException(400, "Cannot book in the past")

        with self.conn.begin(): # Transaction
            # 1. Lock Spot
            spot = self.res_entity.lock_spot(spot_id)
            if not spot:
                raise HTTPException(404, "Spot not found")

            # 2. Check Overlap
            overlap = self.res_entity.count_overlaps(spot_id, start_time, end_time)
            if overlap > 0:
                raise HTTPException(409, "Spot already reserved")

            # 3. Insert
            self.res_entity.create(spot_id, user_id, start_time, end_time)
        
        WebSocketService.broadcast_update(spot_id)

    def complete_reservation(self, reservation_id: int, user_id: int):
        with self.conn.begin():
            res = self.res_entity.find_by_id(reservation_id)
            
            if not res:
                raise HTTPException(404, "Not found")
            
            if res['user_id'] != user_id:
                raise HTTPException(403, "Forbidden")
                
            self.res_entity.complete(reservation_id)
            
        WebSocketService.broadcast_update(res['spot_id'])

    def get_stats(self):
        return self.res_entity.get_hour_stats()
