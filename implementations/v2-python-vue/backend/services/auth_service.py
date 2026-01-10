import jwt
import datetime
from fastapi import HTTPException, Request

import os

JWT_SECRET = os.getenv("JWT_SECRET", "default_dev_secret")
ALGORITHM = "HS256"

class AuthService:
    @staticmethod
    def create_token(user_id: int):
        payload = {
            "uid": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

    @staticmethod
    def get_current_user_id(request: Request):
        auth = request.headers.get("Authorization")
        if not auth:
            raise HTTPException(status_code=401, detail="No token provided")
        try:
            token = auth.split(" ")[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            return int(payload["uid"])
        except:
            raise HTTPException(status_code=401, detail="Invalid token")
