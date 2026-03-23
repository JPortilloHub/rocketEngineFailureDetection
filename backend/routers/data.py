from fastapi import APIRouter

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}
