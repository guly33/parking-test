from fastapi import APIRouter, Depends
from pydantic import BaseModel
from database import get_db_connection
from services.auth_service import AuthService
from services.reservation_service import ReservationService

router = APIRouter()

class ReservationRequest(BaseModel):
    spot_id: int
    start_time: str
    end_time: str

@router.get("/api/spots")
def get_spots(date: str = None):
    with get_db_connection() as conn:
        service = ReservationService(conn)
        return service.get_spots_with_reservations(date)

@router.get("/api/stats")
def get_stats():
    with get_db_connection() as conn:
        service = ReservationService(conn)
        return service.get_stats()

@router.post("/api/reservations", status_code=201)
def create_reservation(req: ReservationRequest, user_id: int = Depends(AuthService.get_current_user_id)):
    with get_db_connection() as conn:
        service = ReservationService(conn)
        service.create_reservation(user_id, req.spot_id, req.start_time, req.end_time)
    return {"message": "Reservation created"}

@router.put("/api/reservations/{id}/complete")
def complete_reservation(id: int, user_id: int = Depends(AuthService.get_current_user_id)):
    with get_db_connection() as conn:
        service = ReservationService(conn)
        service.complete_reservation(id, user_id)
    return {"message": "Reservation completed"}
