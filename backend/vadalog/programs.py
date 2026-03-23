from backend.config import (
    PG_HOST, PG_PORT, PG_USER, PG_PASSWORD,
    NEO4J_HOST, NEO4J_PORT, NEO4J_USER, NEO4J_PASSWORD,
    MARIADB_HOST, MARIADB_PORT, MARIADB_USER, MARIADB_PASSWORD,
    S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET,
)


def _s3_bindings() -> str:
    """Common S3 input bindings for components and component_links."""
    return f'''@input("components").
@bind("components", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "components.csv").
@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "component_linked_to_component.csv").'''


def _employee_bindings() -> str:
    """Common employee data source bindings across all three databases."""
    return f'''@input("employee_psql").
@bind("employee_psql", "postgresql host='{PG_HOST}', port={PG_PORT}, username='{PG_USER}', password='{PG_PASSWORD}'", "prometheux", "employee_psql_table").
@input("employee_neo4j").
@bind("employee_neo4j", "neo4j host='{NEO4J_HOST}', port={NEO4J_PORT}, username='{NEO4J_USER}', password='{NEO4J_PASSWORD}'", "neo4j", "(:Employee)").
@mapping("employee_neo4j", 0, "id", "long").
@mapping("employee_neo4j", 1, "name", "string").
@mapping("employee_neo4j", 2, "role", "string").
@mapping("employee_neo4j", 3, "team", "string").
@mapping("employee_neo4j", 4, "surname", "string").
@mapping("employee_neo4j", 5, "employee_id", "string").
@mapping("employee_neo4j", 6, "employeeId", "string").
@input("employee_mariadb").
@bind("employee_mariadb", "mariadb host='{MARIADB_HOST}', port={MARIADB_PORT}, username='{MARIADB_USER}', password='{MARIADB_PASSWORD}'", "prometheux", "employee_mariadb").'''


def _unified_employee_rules() -> str:
    """Unified employee semantic layer rules."""
    return '''employee(Name, Surname, Role, Team) :- employee_psql(_, Surname, Role, Name, Team).
employee(Name, Surname, Role, Team) :- employee_mariadb(_, Name, Surname, Role, Team).
employee(Name, Surname, Role, Team) :- employee_neo4j(_, Name, Role, Team, Surname, _, _).'''


def _failure_detection_rules() -> str:
    """Common failure detection and propagation rules."""
    return '''failed_sensor(SensorId) :-
    components(SensorId, _, "yes", "failed", _, _).
monitored_component(SensorId, CompId) :-
    failed_sensor(SensorId),
    component_links(CompId, SensorId).
affected(SensorId, CompId) :- monitored_component(SensorId, CompId).
affected(SensorId, ParentId) :-
    affected(SensorId, ChildId),
    component_links(ParentId, ChildId),
    components(ParentId, _, "no", _, _, _).'''


def get_semantic_layer_program() -> str:
    """Full semantic layer with all data sources and raw outputs."""
    return f'''{_employee_bindings()}
{_s3_bindings()}
{_unified_employee_rules()}
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
@output("all_links").'''


def get_stage1_program() -> str:
    """Stage 1: Initial failure detection — failed sensors and direct failures."""
    return f'''{_s3_bindings()}
failed_sensor(SensorId) :-
    components(SensorId, _, "yes", "failed", _, _).
direct_failure(SensorId, AffectedId) :-
    failed_sensor(SensorId),
    component_links(AffectedId, SensorId).
@output("direct_failure").'''


def get_stage2_program() -> str:
    """Stage 2: Recursive failure propagation with step-by-step chain."""
    return f'''{_s3_bindings()}
failed_sensor(SensorId) :-
    components(SensorId, _, "yes", "failed", _, _).
monitored_component(SensorId, CompId) :-
    failed_sensor(SensorId),
    component_links(CompId, SensorId).
failure_chain(SensorId, SensorId, CompId, 1) :-
    monitored_component(SensorId, CompId).
failure_chain(SensorId, ChildId, ParentId, Step) :-
    failure_chain(SensorId, _, ChildId, PrevStep),
    component_links(ParentId, ChildId),
    components(ParentId, _, "no", _, _, _),
    Step = PrevStep + 1.
@output("failure_chain").
@post("failure_chain", "orderby(1, 4)").'''


def get_stage3_program() -> str:
    """Stage 3: Hotspot analysis and root cause identification."""
    return f'''{_s3_bindings()}
{_failure_detection_rules()}
hotspot(CompId, Count) :-
    affected(_, CompId),
    Count = mcount().
max_hotspot(MaxCount) :- hotspot(_, Count), MaxCount = mmax(Count).
root_cause(CompId, Count) :- hotspot(CompId, Count), max_hotspot(Count).
@output("hotspot").
@post("hotspot", "orderby(-2)").
@output("root_cause").'''


def get_stage4_program() -> str:
    """Stage 4: Team leader notification for root cause components."""
    return f'''{_s3_bindings()}
{_employee_bindings()}
{_unified_employee_rules()}
{_failure_detection_rules()}
hotspot(CompId, Count) :-
    affected(_, CompId),
    Count = mcount().
max_hotspot(MaxCount) :- hotspot(_, Count), MaxCount = mmax(Count).
root_cause(CompId, Count) :- hotspot(CompId, Count), max_hotspot(Count).
notification(CompId, Name, Surname, Team) :-
    root_cause(CompId, _),
    components(CompId, _, _, _, _, Team),
    employee(Name, Surname, "Team Leader", Team).
@output("notification").'''


def get_degree_centrality_program() -> str:
    """Graph analytics: degree centrality of the component network."""
    return f'''@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "component_linked_to_component.csv").
edge(X, Y) :- component_links(X, Y).
edge(Y, X) :- component_links(X, Y).
dc_result(Node, Score) :- #DC(edge).
@output("dc_result").
@post("dc_result", "orderby(-2)").'''


def get_shortest_paths_program() -> str:
    """Graph analytics: all-pairs shortest paths in the component network."""
    return f'''@input("component_links").
@bind("component_links", "csv useHeaders=true, accessKey='{S3_ACCESS_KEY}', secretKey='{S3_SECRET_KEY}'", "{S3_BUCKET}", "component_linked_to_component.csv").
edge(X, Y) :- component_links(X, Y).
edge(Y, X) :- component_links(X, Y).
weighted_edge(X, Y, 1) :- edge(X, Y).
shortest_paths(X, Y, Distance) :- #ASP(weighted_edge).
@output("shortest_paths").
@post("shortest_paths", "orderby(1, 2)").'''
