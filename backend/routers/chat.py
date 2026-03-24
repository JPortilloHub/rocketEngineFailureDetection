"""Chat endpoint that proxies to Claude API with Prometheux MCP integration."""

import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import ANTHROPIC_API_KEY, PMTX_TOKEN, PROJECT_ID

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

SYSTEM_PROMPT = f"""You are the Digital Twin Assistant for the Space Shuttle Main Engine (SSME) failure detection system built on the Prometheux platform.

You help engineers understand the rocket engine's component network, failure propagation, root causes, and team responsibilities.

## Your capabilities
You have access to the Prometheux ontology via MCP tools. Use them to query real data when answering questions. The project ID is: {PROJECT_ID}

Available concepts you can run:
- **direct_failure** — Stage 1: detects which sensors have failed and which components they directly affect
- **failure_chain** — Stage 2: traces recursive failure propagation chains step-by-step through the component hierarchy
- **hotspot** / **root_cause** — Stage 3: identifies components where multiple failure chains converge (hotspots) and the root causes with the highest convergence count
- **notification** — Stage 4: determines which team leaders should be notified for each root cause component
- **dc_result** — Graph analytics: degree centrality scores for all components in the network
- **shortest_paths** — Graph analytics: shortest path distances between all pairs of components
- **employee** — Unified employee data from all sources (PostgreSQL, Neo4j, MariaDB)
- **all_components** — Full list of all 30 engine components with their status, team, and observability
- **all_links** — All 29 parent-child relationships in the component hierarchy

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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    content: str
    tool_results: list[dict[str, Any]] | None = None


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
        "anthropic-beta": "mcp-client-2025-11-20",
        "content-type": "application/json",
    }

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 2048,
        "system": SYSTEM_PROMPT,
        "mcp_servers": [
            {
                "type": "url",
                "url": "https://api.prometheux.ai/px-remote-mcp-server",
                "name": "prometheux",
                "authorization_token": PMTX_TOKEN,
            }
        ],
        "tools": [
            {
                "type": "mcp_toolset",
                "mcp_server_name": "prometheux",
            }
        ],
        "messages": [{"role": m.role, "content": m.content} for m in request.messages],
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(CLAUDE_API_URL, json=payload, headers=headers)

            if response.status_code != 200:
                logger.error("Claude API error %s: %s", response.status_code, response.text[:500])
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.text[:200]}",
                )

            data = response.json()

        # Extract text content from the response
        text_parts = []
        tool_results = []
        for block in data.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])
            elif block.get("type") == "mcp_tool_result":
                tool_results.append(block)

        return ChatResponse(
            content="\n".join(text_parts) if text_parts else "I couldn't generate a response.",
            tool_results=tool_results if tool_results else None,
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Claude API request timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat endpoint error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
