# CLAUDE.md — Prometheux Digital Twin Frontend

## Project Overview

This project is Part 2 of an FDE (Forward Deployed Engineer) assignment for **Prometheux**, a startup building an ontology-native data processing engine powered by the Vadalog language. The CTO will personally review this work.

**Part 1** (completed): Built a Digital Twin for rocket engine failure detection using Vadalog on the Prometheux platform. This involved connecting 5 heterogeneous data sources, writing recursive failure propagation logic, identifying root causes via hotspot analysis, and notifying responsible team leaders.

**Part 2** (this project): Build a production-grade frontend dashboard on top of the Prometheux platform that visualizes the Digital Twin's failure detection and response system. The frontend communicates with Prometheux via the `prometheux_chain` Python SDK.

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **Prometheux SDK:** `prometheux_chain` (pip install prometheux-chain)
- **Authentication:** Bearer token (PMTX_TOKEN)
- **API Docs:** Auto-generated Swagger UI at `/docs`

### Frontend
- **Framework:** React 18+ with Vite
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Graph Visualization:** React Flow (for the component network / failure propagation)
- **Charts:** Recharts (for degree centrality, analytics)
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Infrastructure
- **Version Control:** GitHub (public repo)
- **Environment:** `.env` for secrets (never committed)

---

## Prometheux SDK Reference

### Configuration
```python
import prometheux_chain as px
import os

os.environ['PMTX_TOKEN'] = 'YOUR_PMTX_TOKEN'
px.config.set('JARVISPY_URL', "https://api.prometheux.ai/jarvispy/{organization}/{username}")
```

### Key Functions

**Execute Vadalog Program:**
```python
result = px.evaluate_vadalog(
    program=vadalog_code,
    parameters={},
    execution_options={"materialize_intermediate": True},
    timeout=300
)
# Returns: result['results'] contains the output facts
# Example: result['results']['failed_sensor'] = [["Temp_Sensor_A"], ["Temp_Sensor_B"], ...]
```

**Save a Concept:**
```python
px.save_concept(
    project_id="my_project_id",
    concept_logic=vadalog_code
)
```

**Run a Concept:**
```python
results = px.run_concept(
    project_id="my_project_id",
    concept_name="root_cause",
    step_by_step=True,
    persist_outputs=True
)
```

### REST API Alternative
Base URL: `https://api.prometheux.ai/jarvispy/{org}/{user}/api/v1/`
Auth header: `Authorization: Bearer YOUR_JWT_TOKEN`

Key endpoints:
- `POST /vadalog/evaluate` — execute Vadalog programs
- `POST /concepts/{project_id}/run` — run saved concepts
- `POST /concepts/{project_id}/save` — save concepts
- `POST /vadalog/validate` — validate syntax
- `GET /vadalog/status?execution_id=X` — check execution status

---

## Data Sources & Schemas

### 1. PostgreSQL — Employee Table
- **Host:** databases.prometheux.ai:5432
- **Database:** prometheux
- **Table:** employee_psql_table
- **Credentials:** username=prometheux, password=postgres@prometheux
- **Schema:** `Id, Surname, Role, Name, Team`
- **Data:** Contains BranchTeam_A members only (5 rows)
  - TL_A | Smith | Team Leader | Alice | BranchTeam_A
  - A2 | Johnson | Data Analyst | Sarah | BranchTeam_A
  - A1 | Doe | Engineer | John | BranchTeam_A
  - A4 | Jones | QA Specialist | Emily | BranchTeam_A
  - A3 | Williams | Junior Engineer | Robert | BranchTeam_A

### 2. Neo4j — Employee Nodes
- **Host:** databases.prometheux.ai:7687
- **Database:** neo4j
- **Node Label:** (:Employee)
- **Credentials:** username=neo4j, password=neo4j@prometheux
- **Schema:** `id(n):long, name:string, role:string, team:string, surname:string, employee_id:string, employeeId(ID):string`
- **Note:** Requires @mapping annotations to avoid type casting errors. Column 0 must be mapped as "long", rest as "string"

### 3. MariaDB — Employee Table
- **Host:** databases.prometheux.ai:3306
- **Database:** prometheux
- **Table:** employee_mariadb
- **Credentials:** username=prometheux, password=mariadb@prometheux
- **Schema:** `Id, Name, Surname, Role, Team`
- **Data:** Contains ALL Team Leaders (5 rows)
  - TL_SENS | Mike | Orange | Team Leader | SensorsTeam
  - TL_A | Alice | Smith | Team Leader | BranchTeam_A
  - TL_B | Bob | Brown | Team Leader | BranchTeam_B
  - TL_MAIN | Laura | Grey | Team Leader | MainChainTeam
  - TL_C | Charlie | Green | Team Leader | BranchTeam_C

### 4. S3 CSV — Components (30 rows)
- **Bucket:** s3a://prometheux-public-data-bucket
- **File:** components.csv
- **Credentials:** accessKey=AKIARL46MCY2VBISDYAO, secretKey=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
- **Schema:** `ComponentID, SymptomCode, IsObservable, Status, RelatedSymptom, Team`
- **Key data points:**
  - Observable sensors (IsObservable="yes"): Temp_Sensor_A (failed), Temp_Sensor_Pass_A (passed), Temp_Sensor_B (failed), Temp_Sensor_Pass_B (passed), Temp_Sensor_C (failed), Temp_Sensor_Pass_C (passed)
  - Non-observable components (IsObservable="no", Status="unknown"): Fuel_Coolant_Valve_A (BranchTeam_A), Vibration_Suppressor_B (BranchTeam_B), Press_Reg_C (BranchTeam_C), LOX_Tank (MainChainTeam), HPOTP, LPOTP, LPOTP_Discharge, LOX_Supply_Line, Main_Combustion_Chamber, Hot_Gas_Manifold, Oxidizer_Preburner, OPOV, HPOTP_Discharge, Nozzle_Extension, Nozzle_Throat, Main_Injector, Gimbal_Actuator, Bleed_Valve, Helium_Control_System

### 5. S3 CSV — Component Links (29 rows)
- **Bucket:** s3a://prometheux-public-data-bucket
- **File:** component_linked_to_component.csv
- **Credentials:** same as above
- **Schema:** `Parent, Component`
- **Semantics:** Parent CONTAINS Component as a child. Sensors are children of the components they monitor.
- **Key relationships:**
  - Fuel_Coolant_Valve_A → Temp_Sensor_A (sensor is child)
  - Vibration_Suppressor_B → Temp_Sensor_B
  - Press_Reg_C → Temp_Sensor_C
  - HPOTP → Fuel_Coolant_Valve_A (valve is child of HPOTP)
  - Main_Combustion_Chamber → Vibration_Suppressor_B
  - Helium_Control_System → Press_Reg_C
  - Then the main chain continues upward: LPOTP_Discharge → HPOTP, LPOTP → LPOTP_Discharge, LOX_Supply_Line → LPOTP, LOX_Tank → LOX_Supply_Line

---

## Verified Vadalog Programs (Final — Tested on Prometheux Platform)

### Semantic Layer & Core Concepts
```vadalog
% === PostgreSQL Employee Table ===
@input("employee_psql").
@bind("employee_psql", "postgresql host='databases.prometheux.ai', port=5432, username='prometheux', password='postgres@prometheux'", "prometheux", "employee_psql_table").
% === Neo4j Employee Nodes ===
@input("employee_neo4j").
@bind("employee_neo4j", "neo4j host='databases.prometheux.ai', port=7687, username='neo4j', password='neo4j@prometheux'", "neo4j", "(:Employee)").
@mapping("employee_neo4j", 0, "id", "long").
@mapping("employee_neo4j", 1, "name", "string").
@mapping("employee_neo4j", 2, "role", "string").
@mapping("employee_neo4j", 3, "team", "string").
@mapping("employee_neo4j", 4, "surname", "string").
@mapping("employee_neo4j", 5, "employee_id", "string").
@mapping("employee_neo4j", 6, "employeeId", "string").
% === MariaDB Employee Table ===
@input("employee_mariadb").
@bind("employee_mariadb", "mariadb host='databases.prometheux.ai', port=3306, username='prometheux', password='mariadb@prometheux'", "prometheux", "employee_mariadb").
% === S3 CSV: Components ===
@input("components").
@bind("components", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "components.csv").
% === S3 CSV: Component Relationships ===
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% === Unified Employee Semantic Layer ===
% PostgreSQL schema: Id, Surname, Role, Name, Team
employee(Name, Surname, Role, Team) :- employee_psql(_, Surname, Role, Name, Team).
% MariaDB schema: Id, Name, Surname, Role, Team
employee(Name, Surname, Role, Team) :- employee_mariadb(_, Name, Surname, Role, Team).
% Neo4j schema: id, name, role, team, surname, employee_id, employeeId
employee(Name, Surname, Role, Team) :- employee_neo4j(_, Name, Role, Team, Surname, _, _).
% === Raw Data Outputs ===
all_psql(Id, Surname, Role, Name, Team) :- employee_psql(Id, Surname, Role, Name, Team).
all_neo4j(Id, Name, Role, Team, Surname, EmpId, EmpId2) :- employee_neo4j(Id, Name, Role, Team, Surname, EmpId, EmpId2).
all_mariadb(Id, Name, Surname, Role, Team) :- employee_mariadb(Id, Name, Surname, Role, Team).
all_components(Id, SymptomCode, IsObservable, Status, RelatedSymptom, Team) :- components(Id, SymptomCode, IsObservable, Status, RelatedSymptom, Team).
all_links(Parent, Child) :- component_links(Parent, Child).
@output("employee").
@output("all_psql").
@output("all_neo4j").
@output("all_mariadb").
@output("all_components").
@output("all_links").
```

### Stage 1: Initial Failure Detection
```vadalog
@input("components").
@bind("components", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% Detect failed sensors
failed_sensor(SensorId) :- 
    components(SensorId, _, "yes", "failed", _, _).
% Identify the component directly affected by each failed sensor
direct_failure(SensorId, AffectedId) :- 
    failed_sensor(SensorId),
    component_links(AffectedId, SensorId).
@output("direct_failure").
```
**Verified Output:**
- (Temp_Sensor_A, Fuel_Coolant_Valve_A)
- (Temp_Sensor_B, Vibration_Suppressor_B)
- (Temp_Sensor_C, Press_Reg_C)

### Stage 2: Recursive Failure Propagation
```vadalog
@input("components").
@bind("components", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% Detect failed sensors
failed_sensor(SensorId) :- 
    components(SensorId, _, "yes", "failed", _, _).
% Identify the component each sensor monitors
monitored_component(SensorId, CompId) :- 
    failed_sensor(SensorId), 
    component_links(CompId, SensorId).
% Failure chain with explicit from → to at each step
% Base case: sensor → monitored component
failure_chain(SensorId, SensorId, CompId, 1) :- 
    monitored_component(SensorId, CompId).
% Recursive case: from → to at each hop
failure_chain(SensorId, ChildId, ParentId, Step) :- 
    failure_chain(SensorId, _, ChildId, PrevStep), 
    component_links(ParentId, ChildId),
    components(ParentId, _, "no", _, _, _),
    Step = PrevStep + 1.
@output("failure_chain").
@post("failure_chain", "orderby(1, 4)").
```
**Verified Output:** Three failure chains tracked per sensor with step numbers.
- Temp_Sensor_A chain: Fuel_Coolant_Valve_A → HPOTP → LPOTP_Discharge → LPOTP → LOX_Supply_Line → LOX_Tank
- Temp_Sensor_B chain: Vibration_Suppressor_B → Main_Combustion_Chamber → ... → LOX_Tank
- Temp_Sensor_C chain: Press_Reg_C → Helium_Control_System → ... → LOX_Tank

**Key insight:** Failure propagates UPWARD using `component_links(ParentId, ChildId)` because Parent CONTAINS Child. Going from child to parent = going upstream.

### Stage 3: Hotspot & Root Cause Identification
```vadalog
@input("components").
@bind("components", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% Detect failed sensors
failed_sensor(SensorId) :- 
    components(SensorId, _, "yes", "failed", _, _).
% Identify the component each sensor monitors
monitored_component(SensorId, CompId) :- 
    failed_sensor(SensorId), 
    component_links(CompId, SensorId).
% Recursive failure propagation per sensor
affected(SensorId, CompId) :- monitored_component(SensorId, CompId).
affected(SensorId, ParentId) :- 
    affected(SensorId, ChildId), 
    component_links(ParentId, ChildId),
    components(ParentId, _, "no", _, _, _).
% Count how many different sensor failure chains reach each component
hotspot(CompId, Count) :- 
    affected(_, CompId), 
    Count = mcount().
% Find the maximum count
max_hotspot(MaxCount) :- hotspot(_, Count), MaxCount = mmax(Count).
% Root cause = component with the highest count
root_cause(CompId, Count) :- hotspot(CompId, Count), max_hotspot(Count).
@output("hotspot").
@post("hotspot", "orderby(-2)").
@output("root_cause").
```
**Verified Output:**
- 5 root cause components with count=3: HPOTP, LPOTP, LPOTP_Discharge, LOX_Supply_Line, LOX_Tank
- All three sensor failure chains converge at these components.

### Stage 4: Team Leader Notification
```vadalog
@input("components").
@bind("components", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
@input("employee_psql").
@bind("employee_psql", "postgresql host='databases.prometheux.ai', port=5432, username='prometheux', password='postgres@prometheux'", "prometheux", "employee_psql_table").
@input("employee_mariadb").
@bind("employee_mariadb", "mariadb host='databases.prometheux.ai', port=3306, username='prometheux', password='mariadb@prometheux'", "prometheux", "employee_mariadb").
@input("employee_neo4j").
@bind("employee_neo4j", "neo4j host='databases.prometheux.ai', port=7687, username='neo4j', password='neo4j@prometheux'", "neo4j", "(:Employee)").
@mapping("employee_neo4j", 0, "id", "long").
@mapping("employee_neo4j", 1, "name", "string").
@mapping("employee_neo4j", 2, "role", "string").
@mapping("employee_neo4j", 3, "team", "string").
@mapping("employee_neo4j", 4, "surname", "string").
@mapping("employee_neo4j", 5, "employee_id", "string").
@mapping("employee_neo4j", 6, "employeeId", "string").
% Unified employee semantic layer
employee(Name, Surname, Role, Team) :- employee_psql(_, Surname, Role, Name, Team).
employee(Name, Surname, Role, Team) :- employee_mariadb(_, Name, Surname, Role, Team).
employee(Name, Surname, Role, Team) :- employee_neo4j(_, Name, Role, Team, Surname, _, _).
% Failure detection and propagation (same as previous stages)
failed_sensor(SensorId) :- 
    components(SensorId, _, "yes", "failed", _, _).
monitored_component(SensorId, CompId) :- 
    failed_sensor(SensorId), 
    component_links(CompId, SensorId).
affected(SensorId, CompId) :- monitored_component(SensorId, CompId).
affected(SensorId, ParentId) :- 
    affected(SensorId, ChildId), 
    component_links(ParentId, ChildId),
    components(ParentId, _, "no", _, _, _).
% Root cause identification
hotspot(CompId, Count) :- 
    affected(_, CompId), 
    Count = mcount().
max_hotspot(MaxCount) :- hotspot(_, Count), MaxCount = mmax(Count).
root_cause(CompId, Count) :- hotspot(CompId, Count), max_hotspot(Count).
% Stage 4: Notify the team leader responsible for each root cause component
notification(CompId, Name, Surname, Team) :- 
    root_cause(CompId, _),
    components(CompId, _, _, _, _, Team),
    employee(Name, Surname, "Team Leader", Team).
@output("notification").
```
**Verified Output:**
- All 5 root cause components belong to MainChainTeam
- Notification: Laura Grey (Team Leader, MainChainTeam) for all 5 components

### Graph Analytics: Degree Centrality
```vadalog
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% Build undirected edges
edge(X, Y) :- component_links(X, Y).
edge(Y, X) :- component_links(X, Y).
% Degree centrality using built-in function
dc_result(Node, Score) :- #DC(edge).
@output("dc_result").
@post("dc_result", "orderby(-2)").
```

### Graph Analytics: Shortest Paths
```vadalog
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='AKIARL46MCY2VBISDYAO', secretKey='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'", "s3a://prometheux-public-data-bucket", "component_linked_to_component.csv").
% Build undirected edges with weight 1
edge(X, Y) :- component_links(X, Y).
edge(Y, X) :- component_links(X, Y).
% Add uniform weight for shortest path calculation
weighted_edge(X, Y, 1) :- edge(X, Y).
% All shortest paths using built-in function
shortest_paths(X, Y, Distance) :- #ASP(weighted_edge).
@output("shortest_paths").
@post("shortest_paths", "orderby(1, 2)").
```

---

## UI/UX Design System

### Aesthetic Direction: Mission Control Dashboard
Think NASA Mission Control meets modern data dashboard. Dark theme. Data-dense but clean. Every pixel intentional. The kind of interface that makes engineers lean in.

### Color Palette
```css
--bg-primary: #0A0E1A;          /* Deep space navy — main background */
--bg-secondary: #111827;         /* Slightly lighter panels */
--bg-card: #1A1F35;              /* Card/panel backgrounds */
--bg-elevated: #242B45;          /* Hover states, elevated surfaces */

--text-primary: #F1F5F9;         /* Primary text — high contrast */
--text-secondary: #94A3B8;       /* Secondary/muted text */
--text-tertiary: #64748B;        /* Labels, captions */

--accent-blue: #3B82F6;          /* Primary accent — links, active states */
--accent-cyan: #06B6D4;          /* Secondary accent — highlights */

--status-healthy: #10B981;       /* Green — passed/healthy components */
--status-warning: #F59E0B;       /* Amber — propagated/at-risk components */
--status-critical: #EF4444;      /* Red — failed components */
--status-unknown: #6B7280;       /* Gray — unknown/non-observable */
--status-root-cause: #A855F7;    /* Purple — root cause hotspot */

--border-subtle: #1E293B;        /* Subtle borders between panels */
--border-active: #3B82F680;      /* Active/focused border with transparency */
```

### Typography
- **Display/Headings:** JetBrains Mono or Space Mono — monospaced gives the technical/mission-control feel
- **Body text:** IBM Plex Sans — clean, technical, highly readable
- **Data values/numbers:** JetBrains Mono — numbers should always be monospaced for alignment

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Prometheux Digital Twin — SSME Failure Detection       │
│  Status indicators: [● 3 Failures Detected] [● Root Cause ID'd]│
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│  SIDEBAR    │  MAIN AREA: Interactive Component Graph           │
│             │  (React Flow — the centrepiece)                   │
│  - Stages   │                                                   │
│    1. Detect│  Nodes = components, colored by status            │
│    2. Prop  │  Edges = links, animated when showing propagation │
│    3. Root  │  Click node → details panel                       │
│    4. Notify│                                                   │
│             │                                                   │
│  - Analytics│                                                   │
│    Centralty│                                                   │
│    Paths    │                                                   │
│             │                                                   │
├─────────────┼───────────────────────────────────────────────────┤
│  BOTTOM PANEL: Details / Data Tables / Notifications            │
│  Shows contextual data based on selected stage or node          │
└─────────────┴───────────────────────────────────────────────────┘
```

### React Flow Graph — Node Design
Each node in the component graph should be a custom React Flow node:
- **Shape:** Rounded rectangle with subtle border
- **Color:** Based on status (use CSS variables above)
- **Content:** Component name + small status icon
- **Failed nodes:** Pulsing red glow animation (CSS box-shadow pulse)
- **Root cause nodes:** Purple glow with higher intensity
- **Propagation path:** Animated dashed edges flowing in the direction of propagation

### Key Interactions
1. **Stage Selector (sidebar):** Clicking a stage highlights the relevant parts of the graph
   - Stage 1: Highlights failed sensors and their monitored components
   - Stage 2: Animates the failure propagation chain step by step
   - Stage 3: Highlights hotspot nodes with count badges
   - Stage 4: Shows notification card with team leader info

2. **Node Click:** Opens a detail panel showing:
   - Component metadata (from components.csv)
   - Which sensors' failure chains reach this component
   - Degree centrality score
   - Shortest path distances to other key components

3. **Failure Propagation Animation:** When triggered, edges animate sequentially following the step order from the failure_chain output. Each step lights up the next node in the chain with a brief delay, creating a visual "domino effect."

4. **Analytics Tab:** Shows degree centrality as a horizontal bar chart (Recharts) and shortest paths as a heatmap or distance matrix.

### Micro-interactions & Polish
- **Page load:** Staggered fade-in of panels (Framer Motion, 50ms delays)
- **Node hover:** Subtle scale(1.05) + brighten + show tooltip with component info
- **Edge hover:** Highlight the full path this edge belongs to
- **Status badges:** Subtle pulse animation on critical/failed indicators
- **Data loading:** Skeleton loaders while Prometheux API responds
- **Transitions:** All color/opacity changes should have 200ms ease transitions

### Responsive Considerations
- Primary target: Desktop (this is a dashboard for engineers)
- Minimum width: 1280px
- The graph should take up at least 60% of the viewport
- Side panel and bottom panel should be collapsible

---

## Project Structure
```
prometheux-digital-twin-frontend/
├── CLAUDE.md                    (this file)
├── README.md                    (project overview, setup instructions)
├── .env.example                 (template for environment variables)
├── .gitignore
│
├── backend/
│   ├── requirements.txt         (fastapi, uvicorn, prometheux-chain, python-dotenv, cors)
│   ├── app.py                   (FastAPI main application)
│   ├── config.py                (Prometheux SDK configuration)
│   ├── routers/
│   │   ├── digital_twin.py      (endpoints for failure detection stages)
│   │   ├── analytics.py         (endpoints for graph analytics)
│   │   └── data.py              (endpoints for raw data retrieval)
│   └── vadalog/
│       ├── programs.py          (Vadalog program strings as constants)
│       └── __init__.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css            (Tailwind + CSS variables)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── BottomPanel.tsx
│   │   │   ├── graph/
│   │   │   │   ├── ComponentGraph.tsx       (React Flow main component)
│   │   │   │   ├── ComponentNode.tsx        (custom node renderer)
│   │   │   │   ├── AnimatedEdge.tsx         (custom animated edge)
│   │   │   │   └── graphUtils.ts            (layout helpers)
│   │   │   ├── dashboard/
│   │   │   │   ├── StageCard.tsx
│   │   │   │   ├── NotificationCard.tsx
│   │   │   │   ├── HotspotTable.tsx
│   │   │   │   └── MetricsBadge.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── CentralityChart.tsx
│   │   │   │   └── ShortestPathMatrix.tsx
│   │   │   └── ui/                          (shadcn/ui components)
│   │   ├── hooks/
│   │   │   ├── useDigitalTwin.ts            (API calls to backend)
│   │   │   └── useGraphLayout.ts            (React Flow layout logic)
│   │   ├── lib/
│   │   │   ├── api.ts                       (axios/fetch config)
│   │   │   └── utils.ts                     (shadcn utils)
│   │   └── types/
│   │       └── index.ts                     (TypeScript interfaces)
│   └── public/
│       └── prometheux-logo.png
```

---

## Backend API Endpoints Design

```
GET  /api/health                        → Health check
POST /api/digital-twin/run-all          → Run complete Digital Twin pipeline
GET  /api/digital-twin/components       → Get all components
GET  /api/digital-twin/links            → Get all component links
GET  /api/digital-twin/failed-sensors   → Get Stage 1 results
GET  /api/digital-twin/propagation      → Get Stage 2 results
GET  /api/digital-twin/hotspots         → Get Stage 3 results
GET  /api/digital-twin/root-cause       → Get Stage 3 root cause
GET  /api/digital-twin/notifications    → Get Stage 4 results
GET  /api/digital-twin/employees        → Get unified employee data
GET  /api/analytics/degree-centrality   → Get degree centrality scores
GET  /api/analytics/shortest-paths      → Get all shortest paths
```

Each endpoint calls `px.evaluate_vadalog()` with the appropriate Vadalog program and returns structured JSON.

---

## CRITICAL: Security & Environment Variables

**This `CLAUDE.md` file contains real credentials for context purposes only. It MUST be listed in `.gitignore` and never committed to the repository.**

### Rule: NEVER hardcode credentials in source code

When writing backend code (especially `vadalog/programs.py` and `config.py`), **always** read credentials from environment variables via `os.environ` or `python-dotenv`. The Vadalog program strings must inject credentials from env vars at runtime using Python string formatting.

### .env file (local only, never committed)
```
PMTX_TOKEN=your_prometheux_token_here
PMTX_ORG=your_organization
PMTX_USERNAME=your_username
PMTX_URL=https://api.prometheux.ai/jarvispy

PG_HOST=databases.prometheux.ai
PG_PORT=5432
PG_USER=prometheux
PG_PASSWORD=postgres@prometheux

NEO4J_HOST=databases.prometheux.ai
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j@prometheux

MARIADB_HOST=databases.prometheux.ai
MARIADB_PORT=3306
MARIADB_USER=prometheux
MARIADB_PASSWORD=mariadb@prometheux

S3_ACCESS_KEY=AKIARL46MCY2VBISDYAO
S3_SECRET_KEY=w35eM/4pqS7+J5uKP+S6tORUOy5PZB3mJPXvOqAr
S3_BUCKET=s3a://prometheux-public-data-bucket
```

### .env.example (committed to repo — placeholder values)
```
PMTX_TOKEN=your_prometheux_token_here
PMTX_ORG=your_organization
PMTX_USERNAME=your_username
PMTX_URL=https://api.prometheux.ai/jarvispy

PG_HOST=your_postgres_host
PG_PORT=5432
PG_USER=your_postgres_user
PG_PASSWORD=your_postgres_password

NEO4J_HOST=your_neo4j_host
NEO4J_PORT=7687
NEO4J_USER=your_neo4j_user
NEO4J_PASSWORD=your_neo4j_password

MARIADB_HOST=your_mariadb_host
MARIADB_PORT=3306
MARIADB_USER=your_mariadb_user
MARIADB_PASSWORD=your_mariadb_password

S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET=s3a://your-bucket-name
```

### .gitignore must include:
```
.env
CLAUDE.md
node_modules/
__pycache__/
*.pyc
.venv/
dist/
```

### How to use in backend code:
```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

PG_HOST = os.environ["PG_HOST"]
PG_PORT = os.environ["PG_PORT"]
PG_USER = os.environ["PG_USER"]
PG_PASSWORD = os.environ["PG_PASSWORD"]
# ... etc for all credentials
```

```python
# vadalog/programs.py
from config import *

def get_stage1_program():
    return f'''
@input("components").
@bind("components", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "component_linked_to_component.csv").
% ... rest of Vadalog program
'''
```

This pattern ensures all credentials come from the `.env` file at runtime and never appear in committed code.

---

## Key Implementation Notes

1. **The Prometheux SDK might not be available locally** — if `prometheux_chain` can't connect to the Prometheux API, the backend should have a **mock data mode** that returns the known results from Part 1. This ensures the frontend can be developed and demonstrated even without live API access.

2. **CORS must be enabled** on the FastAPI backend for the React frontend to call it.

3. **The graph layout** in React Flow should be computed using dagre or elkjs for automatic hierarchical layout — the component network is a DAG (directed acyclic graph) that should flow top-to-bottom or left-to-right.

4. **Error handling** — the Prometheux API may be slow for complex Vadalog programs. Use loading states and timeouts gracefully.

5. **The "wow moment"** is the failure propagation animation on the graph. Invest time here. When the user clicks "Run Analysis" or selects Stage 2, the graph should animate the failure flowing through the network step by step, lighting up nodes sequentially.

---

## Git Workflow

- Make meaningful commits as you build
- First commit: project structure + README + .env.example + .gitignore (NOT CLAUDE.md — it stays local)
- Then: backend skeleton → frontend skeleton → graph visualization → stages → analytics → polish
- Write a clear README explaining setup, architecture, and how it connects to Part 1
- CLAUDE.md lives only on your local machine for Claude Code context
