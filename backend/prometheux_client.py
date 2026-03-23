"""
Prometheux API client.

Primary: direct HTTP POST to /api/v1/vadalog/evaluate (returns data in resultSet).
Fallback: prometheux_chain SDK (save_concept + run_concept).
"""

import logging
import os
from typing import Any

import httpx
import prometheux_chain as px

from backend.config import (
    PMTX_TOKEN,
    PMTX_URL,
    PMTX_ORG,
    PMTX_USERNAME,
    PROJECT_ID,
)

logger = logging.getLogger(__name__)

# ---- SDK initialisation (runs once at import time) ----
os.environ["PMTX_TOKEN"] = PMTX_TOKEN
_jarvispy_url = f"{PMTX_URL}/{PMTX_ORG}/{PMTX_USERNAME}"
px.config.set("JARVISPY_URL", _jarvispy_url)

# ---- HTTP config ----
_EVALUATE_URL = f"{_jarvispy_url}/api/v1/vadalog/evaluate"
_HTTP_TIMEOUT = 120.0


async def evaluate_vadalog(
    program: str,
    concept_name: str,
    output_predicates: list[str],
) -> dict[str, list[list[Any]]]:
    """Execute a Vadalog program and return results.

    Tries direct HTTP first (faster, returns data in resultSet).
    Falls back to SDK save_concept + run_concept if HTTP fails.

    Returns:
        Dict mapping predicate names to lists of result tuples.
    """
    # --- Attempt 1: Direct HTTP ---
    try:
        return await _run_via_http(program)
    except Exception as http_err:
        logger.warning("HTTP call failed for '%s': %s. Trying SDK fallback.", concept_name, http_err)

    # --- Attempt 2: SDK ---
    try:
        return _run_via_sdk(program, concept_name, output_predicates)
    except Exception as sdk_err:
        logger.exception("SDK fallback also failed for '%s': %s", concept_name, sdk_err)
        raise


async def _run_via_http(program: str) -> dict[str, list[list[Any]]]:
    """Direct HTTP POST to the Vadalog evaluate endpoint.

    Response format:
    {
      "status": "success",
      "data": {
        "resultSet": { "predicate_name": [["val1", "val2"], ...] },
        "columnNames": { ... },
        ...
      }
    }
    """
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {PMTX_TOKEN}",
    }
    payload = {
        "program": program,
        "execution_options": {"materialize_intermediate": True},
    }

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(_EVALUATE_URL, json=payload, headers=headers)
        response.raise_for_status()
        body = response.json()

    # Extract resultSet from the response
    data = body.get("data", {})
    result_set = data.get("resultSet", {})

    if not result_set:
        logger.warning("HTTP response has empty resultSet: %s", body.get("status"))

    return result_set


def _run_via_sdk(
    program: str,
    concept_name: str,
    output_predicates: list[str],
) -> dict[str, list[list[Any]]]:
    """Save concept then run it via the prometheux_chain SDK.

    SDK response format:
    {
      "evaluation_results": {
        "resultSet": { "predicate_name": [["val1", "val2"], ...] },
        ...
      }
    }
    """
    px.save_concept(
        project_id=PROJECT_ID,
        concept_logic=program,
        python_scripts=[],
    )

    result = px.run_concept(
        project_id=PROJECT_ID,
        concept_name=concept_name,
        materialize_intermediate_concepts=True,
        force_rerun=True,
        persist_outputs=True,
    )

    if isinstance(result, dict):
        eval_results = result.get("evaluation_results", {})
        result_set = eval_results.get("resultSet", {})
        if result_set:
            return result_set

    logger.warning("SDK returned no data for '%s': %s", concept_name, result)
    return {}
