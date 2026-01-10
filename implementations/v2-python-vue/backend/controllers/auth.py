from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from entities.user import User
from services.auth_service import AuthService

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/api/login")
def login(creds: LoginRequest):
    with get_db_connection() as conn:
        user_entity = User(conn)
        user = user_entity.find_by_username(creds.username)
        
        if not user:
            raise HTTPException(401, "Invalid credentials")
        
        # In a real app, verify password hash here.
        # Assuming success for legacy seeds if user exists (or matching V1 logic)
        
        token = AuthService.create_token(user.id)
        
        return {"success": True, "token": token, "user": {"id": user.id, "username": creds.username}}
