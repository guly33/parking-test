from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import datetime
from database import get_db_connection
from entities.spot import Spot
from entities.reservation import Reservation
from services.auth_service import AuthService
from services.ws_service import WebSocketService

router = APIRouter()

class ReservationRequest(BaseModel):
    spot_id: int
    start_time: str
    end_time: str

@router.get("/api/spots")
def get_spots(date: str = None):
    if not date:
        date = datetime.date.today().isoformat()
    
    start_day = f"{date} 00:00:00"
    end_day = f"{date} 23:59:59"

    with get_db_connection() as conn:
        spot_entity = Spot(conn)
        res_entity = Reservation(conn)
        
        spots = spot_entity.get_all()
        reservations = res_entity.get_active_in_bad_range(start_day, end_day)
        
        # Merge
        for spot in spots:
            spot['reservations'] = [dict(r) for r in reservations if r['spot_id'] == spot['id']] 

        return spots

@router.post("/api/reservations", status_code=201)
def create_reservation(req: ReservationRequest, user_id: int = Depends(AuthService.get_current_user_id)):
    # Validate Time
    start_dt = datetime.datetime.fromisoformat(req.start_time)
    if start_dt < datetime.datetime.now() - datetime.timedelta(minutes=5):
        raise HTTPException(400, "Cannot book in the past")

    with get_db_connection() as conn:
        with conn.begin(): # Transaction
            res_entity = Reservation(conn)
            
            # 1. Lock Spot
            spot = res_entity.lock_spot(req.spot_id)
            if not spot:
                raise HTTPException(404, "Spot not found")

            # 2. Check Overlap
            overlap = res_entity.count_overlaps(req.spot_id, req.start_time, req.end_time)
            if overlap > 0:
                raise HTTPException(409, "Spot already reserved")

            # 3. Insert
            res_entity.create(req.spot_id, user_id, req.start_time, req.end_time)
        
    WebSocketService.broadcast_update(req.spot_id)
    return {"message": "Reservation created"}

@router.put("/api/reservations/{id}/complete")
def complete_reservation(id: int, user_id: int = Depends(AuthService.get_current_user_id)):
    with get_db_connection() as conn:
        with conn.begin():
            res_entity = Reservation(conn)
            res = res_entity.find_by_id(id)
            
            if not res:
                raise HTTPException(404, "Not found")
            
            if res['user_id'] != user_id:
                raise HTTPException(403, "Forbidden")
                
            res_entity.complete(id)
            
    WebSocketService.broadcast_update(res['spot_id'])
    return {"message": "Reservation completed"}
