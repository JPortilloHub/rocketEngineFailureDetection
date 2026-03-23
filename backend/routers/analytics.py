from fastapi import APIRouter

from backend.config import USE_MOCK

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/degree-centrality")
async def get_degree_centrality():
    if USE_MOCK:
        # Placeholder — real values will come from Prometheux #DC() function
        return {"data": []}
    return {"data": []}


@router.get("/shortest-paths")
async def get_shortest_paths():
    if USE_MOCK:
        return {"data": []}
    return {"data": []}
