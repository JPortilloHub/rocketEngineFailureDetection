import os
from dotenv import load_dotenv

load_dotenv()

# Prometheux SDK
PMTX_TOKEN = os.environ.get("PMTX_TOKEN", "")
PMTX_ORG = os.environ.get("PMTX_ORG", "")
PMTX_USERNAME = os.environ.get("PMTX_USERNAME", "")
PMTX_URL = os.environ.get("PMTX_URL", "https://api.prometheux.ai/jarvispy")

# PostgreSQL
PG_HOST = os.environ.get("PG_HOST", "")
PG_PORT = os.environ.get("PG_PORT", "5432")
PG_USER = os.environ.get("PG_USER", "")
PG_PASSWORD = os.environ.get("PG_PASSWORD", "")

# Neo4j
NEO4J_HOST = os.environ.get("NEO4J_HOST", "")
NEO4J_PORT = os.environ.get("NEO4J_PORT", "7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")

# MariaDB
MARIADB_HOST = os.environ.get("MARIADB_HOST", "")
MARIADB_PORT = os.environ.get("MARIADB_PORT", "3306")
MARIADB_USER = os.environ.get("MARIADB_USER", "")
MARIADB_PASSWORD = os.environ.get("MARIADB_PASSWORD", "")

# S3
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "s3a://prometheux-public-data-bucket")

# Prometheux project
PROJECT_ID = os.environ.get("PROJECT_ID", "")

# Mock mode: if True, return hardcoded results instead of calling Prometheux API
USE_MOCK = os.environ.get("USE_MOCK_DATA", "true").lower() == "true"
