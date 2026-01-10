from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import auth, reservations

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reservations.router)

# Health Check
@app.get("/")
def read_root():
    return {"status": "ok", "version": "v2-python"}
