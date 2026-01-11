from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from controllers import auth, reservations
import os
from logger import get_logger

logger = get_logger(__name__)
logger.info("V2 Python Server Starting...")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # WARN: permissive CORS for development. In production, specify allowed origins.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reservations.router)

# Serve Static Files
# We check /app_frontend first (Docker build), then static/ (local dev fallback)
frontend_dir = "/app_frontend"
if not os.path.exists(frontend_dir):
    frontend_dir = "static"

if os.path.exists(os.path.join(frontend_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

# SPA Fallback
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"):
        logger.warning(f"404 API Request: {full_path}")
        return {"error": "Not Found"}
    
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found"}
