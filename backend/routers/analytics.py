import logging

from fastapi import APIRouter, HTTPException

from backend.prometheux_client import evaluate_vadalog
from backend.vadalog.programs import (
    get_degree_centrality_program,
    get_shortest_paths_program,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _parse_degree_centrality(results: dict) -> list[dict]:
    rows = results.get("dc_result", [])
    return [{"Node": r[0], "Score": float(r[1])} for r in rows]


def _parse_shortest_paths(results: dict) -> list[dict]:
    rows = results.get("shortest_paths", [])
    return [{"From": r[0], "To": r[1], "Distance": int(r[2])} for r in rows]


@router.get("/degree-centrality")
async def get_degree_centrality():
    try:
        results = await evaluate_vadalog(
            program=get_degree_centrality_program(),
            concept_name="dc_result",
            output_predicates=["dc_result"],
        )
        return {"data": _parse_degree_centrality(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (degree centrality)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/shortest-paths")
async def get_shortest_paths():
    try:
        results = await evaluate_vadalog(
            program=get_shortest_paths_program(),
            concept_name="shortest_paths",
            output_predicates=["shortest_paths"],
        )
        return {"data": _parse_shortest_paths(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (shortest paths)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")
