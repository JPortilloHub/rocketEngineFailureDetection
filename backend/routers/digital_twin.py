from fastapi import APIRouter

from backend.config import USE_MOCK
from backend import mock_data

router = APIRouter(prefix="/api/digital-twin", tags=["digital-twin"])


@router.get("/components")
async def get_components():
    if USE_MOCK:
        return {"data": mock_data.COMPONENTS}
    # TODO: call px.evaluate_vadalog with semantic layer program
    return {"data": []}


@router.get("/links")
async def get_links():
    if USE_MOCK:
        return {"data": mock_data.COMPONENT_LINKS}
    return {"data": []}


@router.get("/employees")
async def get_employees():
    if USE_MOCK:
        return {"data": mock_data.EMPLOYEES}
    return {"data": []}


@router.get("/failed-sensors")
async def get_failed_sensors():
    """Stage 1: Initial failure detection."""
    if USE_MOCK:
        return {"data": mock_data.DIRECT_FAILURES}
    return {"data": []}


@router.get("/propagation")
async def get_propagation():
    """Stage 2: Recursive failure propagation chains."""
    if USE_MOCK:
        return {"data": mock_data.FAILURE_CHAINS}
    return {"data": []}


@router.get("/hotspots")
async def get_hotspots():
    """Stage 3: Hotspot analysis."""
    if USE_MOCK:
        return {"data": mock_data.HOTSPOTS}
    return {"data": []}


@router.get("/root-cause")
async def get_root_cause():
    """Stage 3: Root cause components."""
    if USE_MOCK:
        return {"data": mock_data.ROOT_CAUSES}
    return {"data": []}


@router.get("/notifications")
async def get_notifications():
    """Stage 4: Team leader notifications."""
    if USE_MOCK:
        return {"data": mock_data.NOTIFICATIONS}
    return {"data": []}
