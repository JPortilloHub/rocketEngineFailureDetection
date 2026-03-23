import logging

from fastapi import APIRouter, HTTPException

from backend.config import USE_MOCK
from backend import mock_data
from backend.prometheux_client import evaluate_vadalog
from backend.vadalog.programs import (
    get_semantic_layer_program,
    get_stage1_program,
    get_stage2_program,
    get_stage3_program,
    get_stage4_program,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/digital-twin", tags=["digital-twin"])


# ---------------------------------------------------------------------------
# Parsers: transform Prometheux tuple-lists → frontend JSON shapes
# ---------------------------------------------------------------------------

def _parse_components(results: dict) -> list[dict]:
    rows = results.get("all_components", [])
    return [
        {
            "ComponentID": r[0],
            "SymptomCode": r[1],
            "IsObservable": r[2],
            "Status": r[3],
            "RelatedSymptom": r[4],
            "Team": r[5],
        }
        for r in rows
    ]


def _parse_links(results: dict) -> list[dict]:
    rows = results.get("all_links", [])
    return [{"Parent": r[0], "Component": r[1]} for r in rows]


def _parse_employees(results: dict) -> list[dict]:
    rows = results.get("employee", [])
    return [
        {"Name": r[0], "Surname": r[1], "Role": r[2], "Team": r[3]}
        for r in rows
    ]


def _parse_direct_failures(results: dict) -> list[dict]:
    rows = results.get("direct_failure", [])
    return [{"SensorId": r[0], "AffectedId": r[1]} for r in rows]


def _parse_failure_chains(results: dict) -> list[dict]:
    rows = results.get("failure_chain", [])
    return [
        {"SensorId": r[0], "From": r[1], "To": r[2], "Step": int(r[3])}
        for r in rows
    ]


def _parse_hotspots(results: dict) -> list[dict]:
    rows = results.get("hotspot", [])
    return [{"ComponentId": r[0], "Count": int(r[1])} for r in rows]


def _parse_root_causes(results: dict) -> list[dict]:
    rows = results.get("root_cause", [])
    return [{"ComponentId": r[0], "Count": int(r[1])} for r in rows]


def _parse_notifications(results: dict) -> list[dict]:
    rows = results.get("notification", [])
    return [
        {"ComponentId": r[0], "Name": r[1], "Surname": r[2], "Team": r[3]}
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/components")
async def get_components():
    if USE_MOCK:
        return {"data": mock_data.COMPONENTS}
    try:
        results = await evaluate_vadalog(
            program=get_semantic_layer_program(),
            concept_name="all_components",
            output_predicates=["all_components"],
        )
        return {"data": _parse_components(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (components)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/links")
async def get_links():
    if USE_MOCK:
        return {"data": mock_data.COMPONENT_LINKS}
    try:
        results = await evaluate_vadalog(
            program=get_semantic_layer_program(),
            concept_name="all_links",
            output_predicates=["all_links"],
        )
        return {"data": _parse_links(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (links)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/employees")
async def get_employees():
    if USE_MOCK:
        return {"data": mock_data.EMPLOYEES}
    try:
        results = await evaluate_vadalog(
            program=get_semantic_layer_program(),
            concept_name="employee",
            output_predicates=["employee"],
        )
        return {"data": _parse_employees(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (employees)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/failed-sensors")
async def get_failed_sensors():
    """Stage 1: Initial failure detection."""
    if USE_MOCK:
        return {"data": mock_data.DIRECT_FAILURES}
    try:
        results = await evaluate_vadalog(
            program=get_stage1_program(),
            concept_name="direct_failure",
            output_predicates=["direct_failure"],
        )
        return {"data": _parse_direct_failures(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (stage 1)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/propagation")
async def get_propagation():
    """Stage 2: Recursive failure propagation chains."""
    if USE_MOCK:
        return {"data": mock_data.FAILURE_CHAINS}
    try:
        results = await evaluate_vadalog(
            program=get_stage2_program(),
            concept_name="failure_chain",
            output_predicates=["failure_chain"],
        )
        return {"data": _parse_failure_chains(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (stage 2)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/hotspots")
async def get_hotspots():
    """Stage 3: Hotspot analysis."""
    if USE_MOCK:
        return {"data": mock_data.HOTSPOTS}
    try:
        results = await evaluate_vadalog(
            program=get_stage3_program(),
            concept_name="hotspot",
            output_predicates=["hotspot"],
        )
        return {"data": _parse_hotspots(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (stage 3 hotspots)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/root-cause")
async def get_root_cause():
    """Stage 3: Root cause components."""
    if USE_MOCK:
        return {"data": mock_data.ROOT_CAUSES}
    try:
        results = await evaluate_vadalog(
            program=get_stage3_program(),
            concept_name="root_cause",
            output_predicates=["root_cause"],
        )
        return {"data": _parse_root_causes(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (stage 3 root cause)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")


@router.get("/notifications")
async def get_notifications():
    """Stage 4: Team leader notifications."""
    if USE_MOCK:
        return {"data": mock_data.NOTIFICATIONS}
    try:
        results = await evaluate_vadalog(
            program=get_stage4_program(),
            concept_name="notification",
            output_predicates=["notification"],
        )
        return {"data": _parse_notifications(results)}
    except Exception as exc:
        logger.exception("Prometheux API error (stage 4)")
        raise HTTPException(status_code=502, detail=f"Prometheux API error: {exc}")
