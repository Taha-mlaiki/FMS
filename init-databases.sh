#!/bin/bash
# ================================================================
# Initialize multiple PostgreSQL databases
# ================================================================
# This script runs on first startup of the postgres container.
# It creates separate databases for each microservice.
# ================================================================

set -e

echo "Creating additional databases..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE user_service_db;
    CREATE DATABASE farm_service_db;
    CREATE DATABASE task_service_db;
    CREATE DATABASE production_service_db;
    CREATE DATABASE stock_service_db;
    CREATE DATABASE report_service_db;
EOSQL

echo "All databases created successfully!"
