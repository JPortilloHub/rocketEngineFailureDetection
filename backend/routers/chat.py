"""Chat endpoint — Claude API with tool use to query Digital Twin data."""

import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import ANTHROPIC_API_KEY
from backend.prometheux_client import evaluate_vadalog
from backend.vadalog.programs import (
    get_semantic_layer_program,
    get_stage1_program,
    get_stage2_program,
    get_stage3_program,
    get_stage4_program,
)
from backend.routers.digital_twin import (
    _parse_components,
    _parse_links,
    _parse_employees,
    _parse_direct_failures,
    _parse_failure_chains,
    _parse_hotspots,
    _parse_root_causes,
    _parse_notifications,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are the Prometheux Assistant for the Space Shuttle Main Engine (SSME) failure detection system.

You help engineers understand the rocket engine's component network, failure propagation, root causes, and team responsibilities.

## Your capabilities
You have tools to query the Digital Twin data in real time. Use them to answer questions with actual data.

Available tools:
- **get_components** — Full list of all 30 engine components with status, team, and observability
- **get_links** — All 29 parent-child relationships in the component hierarchy
- **get_employees** — Unified employee data from all sources (PostgreSQL, Neo4j, MariaDB)
- **get_failed_sensors** — Stage 1: which sensors failed and which components they directly affect
- **get_propagation** — Stage 2: recursive failure propagation chains step-by-step
- **get_hotspots** — Stage 3: components where multiple failure chains converge
- **get_root_causes** — Stage 3: root cause components with highest convergence count
- **get_notifications** — Stage 4: which team leaders should be notified

## Domain context
- The engine has 30 components across 5 teams: MainChainTeam, BranchTeam_A, BranchTeam_B, BranchTeam_C, SensorsTeam
- 6 observable sensors (3 failed: Temp_Sensor_A, Temp_Sensor_B, Temp_Sensor_C; 3 passed)
- 24 non-observable components with unknown status
- Failure propagates UPWARD: from sensors → branch components → main chain → LOX_Tank
- Parent CONTAINS Child in the hierarchy (component_links)
- Root causes are where all 3 failure chains converge (highest hotspot count)

## Response guidelines
- Be concise and technical — you're talking to engineers
- When mentioning component names, use their exact IDs (e.g., HPOTP, LOX_Tank, Fuel_Coolant_Valve_A)
- Format data as markdown tables when showing multiple results
- If asked about something outside the engine domain, politely redirect"""

# ---------------------------------------------------------------------------
# Tool definitions for Claude
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "get_components",
        "description": "Get all 30 engine components with their status, team, observability, and symptom codes.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_links",
        "description": "Get all 29 parent-child component relationships. Parent CONTAINS Child.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_employees",
        "description": "Get unified employee data from PostgreSQL, Neo4j, and MariaDB sources.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_failed_sensors",
        "description": "Stage 1: Get failed sensors and the components they directly affect.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_propagation",
        "description": "Stage 2: Get recursive failure propagation chains with step-by-step tracing through the component hierarchy.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_hotspots",
        "description": "Stage 3: Get hotspot analysis — components where multiple sensor failure chains converge, with convergence count.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_root_causes",
        "description": "Stage 3: Get root cause components — those with the highest hotspot convergence count.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_notifications",
        "description": "Stage 4: Get team leader notifications — which leaders should be notified for each root cause component.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]

# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------


async def _execute_tool(name: str) -> str:
    """Execute a tool and return JSON string result."""
    try:
        if name == "get_components":
            results = await evaluate_vadalog(
                program=get_semantic_layer_program(),
                concept_name="all_components",
                output_predicates=["all_components"],
            )
            return json.dumps(_parse_components(results))

        elif name == "get_links":
            results = await evaluate_vadalog(
                program=get_semantic_layer_program(),
                concept_name="all_links",
                output_predicates=["all_links"],
            )
            return json.dumps(_parse_links(results))

        elif name == "get_employees":
            results = await evaluate_vadalog(
                program=get_semantic_layer_program(),
                concept_name="employee",
                output_predicates=["employee"],
            )
            return json.dumps(_parse_employees(results))

        elif name == "get_failed_sensors":
            results = await evaluate_vadalog(
                program=get_stage1_program(),
                concept_name="direct_failure",
                output_predicates=["direct_failure"],
            )
            return json.dumps(_parse_direct_failures(results))

        elif name == "get_propagation":
            results = await evaluate_vadalog(
                program=get_stage2_program(),
                concept_name="failure_chain",
                output_predicates=["failure_chain"],
            )
            return json.dumps(_parse_failure_chains(results))

        elif name == "get_hotspots":
            results = await evaluate_vadalog(
                program=get_stage3_program(),
                concept_name="hotspot",
                output_predicates=["hotspot"],
            )
            return json.dumps(_parse_hotspots(results))

        elif name == "get_root_causes":
            results = await evaluate_vadalog(
                program=get_stage3_program(),
                concept_name="root_cause",
                output_predicates=["root_cause"],
            )
            return json.dumps(_parse_root_causes(results))

        elif name == "get_notifications":
            results = await evaluate_vadalog(
                program=get_stage4_program(),
                concept_name="notification",
                output_predicates=["notification"],
            )
            return json.dumps(_parse_notifications(results))

        else:
            return json.dumps({"error": f"Unknown tool: {name}"})

    except Exception as e:
        logger.exception("Tool execution error for %s: %s", name, e)
        return json.dumps({"error": str(e)})


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    content: str
    tool_results: list[dict[str, Any]] | None = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY not configured. Add it to your .env file.",
        )

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    # Build initial messages from the request
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Agentic loop: keep going until Claude stops calling tools
            for _ in range(10):  # max iterations to prevent infinite loops
                payload = {
                    "model": CLAUDE_MODEL,
                    "max_tokens": 2048,
                    "system": SYSTEM_PROMPT,
                    "tools": TOOLS,
                    "messages": messages,
                }

                response = await client.post(CLAUDE_API_URL, json=payload, headers=headers)

                if response.status_code != 200:
                    logger.error("Claude API error %s: %s", response.status_code, response.text[:500])
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Claude API error: {response.text[:200]}",
                    )

                data = response.json()
                stop_reason = data.get("stop_reason")
                logger.debug("Claude response: stop_reason=%s, blocks=%d",
                             stop_reason, len(data.get("content", [])))

                # If Claude is done (no tool calls), extract text and return
                if stop_reason == "end_turn":
                    text_parts = []
                    for block in data.get("content", []):
                        if block.get("type") == "text":
                            text_parts.append(block["text"])
                    return ChatResponse(
                        content="\n".join(text_parts) if text_parts else "I couldn't generate a response.",
                    )

                # If Claude wants to call tools, execute them
                if stop_reason == "tool_use":
                    # Strip 'caller' field from tool_use blocks before echoing back
                    clean_content = []
                    for block in data["content"]:
                        b = {k: v for k, v in block.items() if k != "caller"}
                        clean_content.append(b)
                    messages.append({"role": "assistant", "content": clean_content})

                    # Execute each tool and collect results
                    tool_results = []
                    for block in data.get("content", []):
                        if block.get("type") == "tool_use":
                            result = await _execute_tool(block["name"])
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block["id"],
                                "content": result or "No data returned",
                            })

                    if not tool_results:
                        # No tool calls found despite stop_reason — return text
                        text_parts = []
                        for block in data.get("content", []):
                            if block.get("type") == "text":
                                text_parts.append(block["text"])
                        return ChatResponse(
                            content="\n".join(text_parts) if text_parts else "I couldn't generate a response.",
                        )

                    # Append tool results as user message
                    messages.append({"role": "user", "content": tool_results})
                    continue

                # Any other stop reason — return whatever text we have
                text_parts = []
                for block in data.get("content", []):
                    if block.get("type") == "text":
                        text_parts.append(block["text"])
                return ChatResponse(
                    content="\n".join(text_parts) if text_parts else "I couldn't generate a response.",
                )

        # If we exhausted the loop
        return ChatResponse(content="I ran out of iterations processing your request.")

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Claude API request timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat endpoint error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
