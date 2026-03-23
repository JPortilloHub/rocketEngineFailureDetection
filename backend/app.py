from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import digital_twin, analytics, data

app = FastAPI(
    title="Prometheux Digital Twin API",
    description="Backend for SSME failure detection dashboard",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(digital_twin.router)
app.include_router(analytics.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
