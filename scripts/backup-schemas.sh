#!/bin/bash
# ================================================================
# FMS Database Backup Script (Per Schema)
# ================================================================
# This script is meant to be run via a cron job (daily).
# It lists all "farm_*" schemas and backs them up individually
# into timestamped .sql or .dump files.
# ================================================================

# Configuration (These should be injected via env variables in prod)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USERNAME:-postgres}
DB_PASS=${DB_PASSWORD:-postgres123}
POSTGRES_DB=${DB_NAME:-auth_service_db} # Or any DB resolving to the cluster
BACKUP_DIR="/var/backups/fms"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "Starting FMS Schema Backups at $DATE"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR/$DATE"

export PGPASSWORD=$DB_PASS

# 1. Get a list of all tenant schemas (farm_*)
# We connect to any database in the cluster since schemas are per-db
# We'll just loop through all our service DBs if needed, or target the main ones
# For FMS, all tenant schemas will be created inside the relevant service databases.

# Let's say we are backing up the user_service_db as an example:
TARGET_DB="user_service_db"

echo "Querying tenant schemas in $TARGET_DB..."

SCHEMAS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'farm_%';" | xargs)

if [ -z "$SCHEMAS" ]; then
    echo "No tenant schemas found."
    exit 0
fi

# 2. Iterate through each schema and pg_dump it
for SCHEMA in $SCHEMAS; do
    echo "Backing up schema: $SCHEMA"
    
    BACKUP_FILE="$BACKUP_DIR/$DATE/${TARGET_DB}_${SCHEMA}.sql"
    
    # Dump just this specific schema
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -n "$SCHEMA" -F p -f "$BACKUP_FILE"
    
    echo "  -> Saved to $BACKUP_FILE"
done

# 3. Clean up old backups (keep last 30 days)
echo "Cleaning up backups older than 30 days..."
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "Backup process completed successfully."
