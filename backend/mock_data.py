"""
Mock data based on verified Prometheux platform outputs from Part 1.
Used when USE_MOCK=true or when the Prometheux API is unavailable.
"""

COMPONENTS = [
    {"ComponentID": "Temp_Sensor_A", "SymptomCode": "S001", "IsObservable": "yes", "Status": "failed", "RelatedSymptom": "overheating", "Team": "BranchTeam_A"},
    {"ComponentID": "Temp_Sensor_Pass_A", "SymptomCode": "S002", "IsObservable": "yes", "Status": "passed", "RelatedSymptom": "none", "Team": "BranchTeam_A"},
    {"ComponentID": "Temp_Sensor_B", "SymptomCode": "S003", "IsObservable": "yes", "Status": "failed", "RelatedSymptom": "vibration", "Team": "BranchTeam_B"},
    {"ComponentID": "Temp_Sensor_Pass_B", "SymptomCode": "S004", "IsObservable": "yes", "Status": "passed", "RelatedSymptom": "none", "Team": "BranchTeam_B"},
    {"ComponentID": "Temp_Sensor_C", "SymptomCode": "S005", "IsObservable": "yes", "Status": "failed", "RelatedSymptom": "pressure_anomaly", "Team": "BranchTeam_C"},
    {"ComponentID": "Temp_Sensor_Pass_C", "SymptomCode": "S006", "IsObservable": "yes", "Status": "passed", "RelatedSymptom": "none", "Team": "BranchTeam_C"},
    {"ComponentID": "Fuel_Coolant_Valve_A", "SymptomCode": "S007", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S001", "Team": "BranchTeam_A"},
    {"ComponentID": "Vibration_Suppressor_B", "SymptomCode": "S008", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S003", "Team": "BranchTeam_B"},
    {"ComponentID": "Press_Reg_C", "SymptomCode": "S009", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S005", "Team": "BranchTeam_C"},
    {"ComponentID": "HPOTP", "SymptomCode": "S010", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S007", "Team": "MainChainTeam"},
    {"ComponentID": "Main_Combustion_Chamber", "SymptomCode": "S011", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S008", "Team": "MainChainTeam"},
    {"ComponentID": "Helium_Control_System", "SymptomCode": "S012", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S009", "Team": "MainChainTeam"},
    {"ComponentID": "LPOTP", "SymptomCode": "S013", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S010", "Team": "MainChainTeam"},
    {"ComponentID": "LPOTP_Discharge", "SymptomCode": "S014", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S010", "Team": "MainChainTeam"},
    {"ComponentID": "LOX_Supply_Line", "SymptomCode": "S015", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S013", "Team": "MainChainTeam"},
    {"ComponentID": "LOX_Tank", "SymptomCode": "S016", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S015", "Team": "MainChainTeam"},
    {"ComponentID": "Hot_Gas_Manifold", "SymptomCode": "S017", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S011", "Team": "MainChainTeam"},
    {"ComponentID": "Oxidizer_Preburner", "SymptomCode": "S018", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S010", "Team": "MainChainTeam"},
    {"ComponentID": "OPOV", "SymptomCode": "S019", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S018", "Team": "MainChainTeam"},
    {"ComponentID": "HPOTP_Discharge", "SymptomCode": "S020", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S010", "Team": "MainChainTeam"},
    {"ComponentID": "Nozzle_Extension", "SymptomCode": "S021", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S011", "Team": "MainChainTeam"},
    {"ComponentID": "Nozzle_Throat", "SymptomCode": "S022", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S011", "Team": "MainChainTeam"},
    {"ComponentID": "Main_Injector", "SymptomCode": "S023", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S011", "Team": "MainChainTeam"},
    {"ComponentID": "Gimbal_Actuator", "SymptomCode": "S024", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S011", "Team": "MainChainTeam"},
    {"ComponentID": "Bleed_Valve", "SymptomCode": "S025", "IsObservable": "no", "Status": "unknown", "RelatedSymptom": "S010", "Team": "MainChainTeam"},
]

COMPONENT_LINKS = [
    {"Parent": "Fuel_Coolant_Valve_A", "Component": "Temp_Sensor_A"},
    {"Parent": "Fuel_Coolant_Valve_A", "Component": "Temp_Sensor_Pass_A"},
    {"Parent": "Vibration_Suppressor_B", "Component": "Temp_Sensor_B"},
    {"Parent": "Vibration_Suppressor_B", "Component": "Temp_Sensor_Pass_B"},
    {"Parent": "Press_Reg_C", "Component": "Temp_Sensor_C"},
    {"Parent": "Press_Reg_C", "Component": "Temp_Sensor_Pass_C"},
    {"Parent": "HPOTP", "Component": "Fuel_Coolant_Valve_A"},
    {"Parent": "HPOTP", "Component": "Oxidizer_Preburner"},
    {"Parent": "HPOTP", "Component": "HPOTP_Discharge"},
    {"Parent": "HPOTP", "Component": "Bleed_Valve"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Vibration_Suppressor_B"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Nozzle_Extension"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Nozzle_Throat"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Main_Injector"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Gimbal_Actuator"},
    {"Parent": "Main_Combustion_Chamber", "Component": "Hot_Gas_Manifold"},
    {"Parent": "Helium_Control_System", "Component": "Press_Reg_C"},
    {"Parent": "Helium_Control_System", "Component": "OPOV"},
    {"Parent": "LPOTP_Discharge", "Component": "HPOTP"},
    {"Parent": "LPOTP_Discharge", "Component": "Main_Combustion_Chamber"},
    {"Parent": "LPOTP_Discharge", "Component": "Helium_Control_System"},
    {"Parent": "LPOTP", "Component": "LPOTP_Discharge"},
    {"Parent": "LOX_Supply_Line", "Component": "LPOTP"},
    {"Parent": "LOX_Tank", "Component": "LOX_Supply_Line"},
]

EMPLOYEES = [
    {"Name": "Alice", "Surname": "Smith", "Role": "Team Leader", "Team": "BranchTeam_A"},
    {"Name": "John", "Surname": "Doe", "Role": "Engineer", "Team": "BranchTeam_A"},
    {"Name": "Sarah", "Surname": "Johnson", "Role": "Data Analyst", "Team": "BranchTeam_A"},
    {"Name": "Robert", "Surname": "Williams", "Role": "Junior Engineer", "Team": "BranchTeam_A"},
    {"Name": "Emily", "Surname": "Jones", "Role": "QA Specialist", "Team": "BranchTeam_A"},
    {"Name": "Bob", "Surname": "Brown", "Role": "Team Leader", "Team": "BranchTeam_B"},
    {"Name": "Charlie", "Surname": "Green", "Role": "Team Leader", "Team": "BranchTeam_C"},
    {"Name": "Mike", "Surname": "Orange", "Role": "Team Leader", "Team": "SensorsTeam"},
    {"Name": "Laura", "Surname": "Grey", "Role": "Team Leader", "Team": "MainChainTeam"},
]

# Stage 1: Direct failures
DIRECT_FAILURES = [
    {"SensorId": "Temp_Sensor_A", "AffectedId": "Fuel_Coolant_Valve_A"},
    {"SensorId": "Temp_Sensor_B", "AffectedId": "Vibration_Suppressor_B"},
    {"SensorId": "Temp_Sensor_C", "AffectedId": "Press_Reg_C"},
]

# Stage 2: Failure chains (SensorId, From, To, Step)
FAILURE_CHAINS = [
    {"SensorId": "Temp_Sensor_A", "From": "Temp_Sensor_A", "To": "Fuel_Coolant_Valve_A", "Step": 1},
    {"SensorId": "Temp_Sensor_A", "From": "Fuel_Coolant_Valve_A", "To": "HPOTP", "Step": 2},
    {"SensorId": "Temp_Sensor_A", "From": "HPOTP", "To": "LPOTP_Discharge", "Step": 3},
    {"SensorId": "Temp_Sensor_A", "From": "LPOTP_Discharge", "To": "LPOTP", "Step": 4},
    {"SensorId": "Temp_Sensor_A", "From": "LPOTP", "To": "LOX_Supply_Line", "Step": 5},
    {"SensorId": "Temp_Sensor_A", "From": "LOX_Supply_Line", "To": "LOX_Tank", "Step": 6},
    {"SensorId": "Temp_Sensor_B", "From": "Temp_Sensor_B", "To": "Vibration_Suppressor_B", "Step": 1},
    {"SensorId": "Temp_Sensor_B", "From": "Vibration_Suppressor_B", "To": "Main_Combustion_Chamber", "Step": 2},
    {"SensorId": "Temp_Sensor_B", "From": "Main_Combustion_Chamber", "To": "LPOTP_Discharge", "Step": 3},
    {"SensorId": "Temp_Sensor_B", "From": "LPOTP_Discharge", "To": "LPOTP", "Step": 4},
    {"SensorId": "Temp_Sensor_B", "From": "LPOTP", "To": "LOX_Supply_Line", "Step": 5},
    {"SensorId": "Temp_Sensor_B", "From": "LOX_Supply_Line", "To": "LOX_Tank", "Step": 6},
    {"SensorId": "Temp_Sensor_C", "From": "Temp_Sensor_C", "To": "Press_Reg_C", "Step": 1},
    {"SensorId": "Temp_Sensor_C", "From": "Press_Reg_C", "To": "Helium_Control_System", "Step": 2},
    {"SensorId": "Temp_Sensor_C", "From": "Helium_Control_System", "To": "LPOTP_Discharge", "Step": 3},
    {"SensorId": "Temp_Sensor_C", "From": "LPOTP_Discharge", "To": "LPOTP", "Step": 4},
    {"SensorId": "Temp_Sensor_C", "From": "LPOTP", "To": "LOX_Supply_Line", "Step": 5},
    {"SensorId": "Temp_Sensor_C", "From": "LOX_Supply_Line", "To": "LOX_Tank", "Step": 6},
]

# Stage 3: Hotspots (ComponentId, Count of sensor chains reaching it)
HOTSPOTS = [
    {"ComponentId": "LPOTP_Discharge", "Count": 3},
    {"ComponentId": "LPOTP", "Count": 3},
    {"ComponentId": "LOX_Supply_Line", "Count": 3},
    {"ComponentId": "LOX_Tank", "Count": 3},
    {"ComponentId": "HPOTP", "Count": 3},
    {"ComponentId": "Main_Combustion_Chamber", "Count": 1},
    {"ComponentId": "Helium_Control_System", "Count": 1},
    {"ComponentId": "Fuel_Coolant_Valve_A", "Count": 1},
    {"ComponentId": "Vibration_Suppressor_B", "Count": 1},
    {"ComponentId": "Press_Reg_C", "Count": 1},
]

ROOT_CAUSES = [
    {"ComponentId": "LPOTP", "Count": 3},
    {"ComponentId": "LOX_Supply_Line", "Count": 3},
    {"ComponentId": "HPOTP", "Count": 3},
    {"ComponentId": "LOX_Tank", "Count": 3},
    {"ComponentId": "LPOTP_Discharge", "Count": 3},
]

# Stage 4: Notifications
NOTIFICATIONS = [
    {"ComponentId": "LPOTP_Discharge", "Name": "Laura", "Surname": "Grey", "Team": "MainChainTeam"},
    {"ComponentId": "LOX_Tank", "Name": "Laura", "Surname": "Grey", "Team": "MainChainTeam"},
    {"ComponentId": "LOX_Supply_Line", "Name": "Laura", "Surname": "Grey", "Team": "MainChainTeam"},
    {"ComponentId": "HPOTP", "Name": "Laura", "Surname": "Grey", "Team": "MainChainTeam"},
    {"ComponentId": "LPOTP", "Name": "Laura", "Surname": "Grey", "Team": "MainChainTeam"},
]
