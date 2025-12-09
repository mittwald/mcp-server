#!/bin/bash
# Mittwald Backup Status Report
# Comprehensive backup status across all projects and databases

export MITTWALD_API_TOKEN="699b1b90-5476-44b8-a504-f491ea771814:0VtMXEbKm-Ub7pLWGc-VCbDJrkzC41SNMSo1AWJsDMI:mittwald_a"
MW_CLI="/Users/robert/Code/mittwald-mcp/node_modules/.bin/mw"

echo "====================================================================="
echo "              MITTWALD BACKUP STATUS REPORT"
echo "              Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "====================================================================="
echo ""

# Get all projects
PROJECTS=$($MW_CLI project list --output json 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch projects"
    exit 1
fi

TOTAL_PROJECTS=$(echo "$PROJECTS" | jq -r 'length')
TOTAL_MYSQL=0
TOTAL_REDIS=0
TOTAL_BACKUPS=0

echo "Found $TOTAL_PROJECTS projects"
echo ""

# Create temporary files to avoid subshell counter issues
TMPFILE=$(mktemp)

# Process each project
for i in $(seq 0 $((TOTAL_PROJECTS - 1))); do
    PROJECT=$(echo "$PROJECTS" | jq -r ".[$i]")
    PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')
    PROJECT_SHORT_ID=$(echo "$PROJECT" | jq -r '.shortId')
    PROJECT_NAME=$(echo "$PROJECT" | jq -r '.description')
    BACKUP_STORAGE=$(echo "$PROJECT" | jq -r '.backupStorageUsageInBytes')
    BACKUP_STORAGE_HR=$(numfmt --to=iec $BACKUP_STORAGE 2>/dev/null || echo "$BACKUP_STORAGE bytes")

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PROJECT: $PROJECT_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Short ID:        $PROJECT_SHORT_ID"
    echo "  Full ID:         $PROJECT_ID"
    echo "  Backup Storage:  $BACKUP_STORAGE_HR"
    echo ""

    # Get MySQL databases
    MYSQL_DBS=$($MW_CLI database mysql list --project-id "$PROJECT_ID" --output json 2>/dev/null)
    if [ $? -eq 0 ]; then
        MYSQL_COUNT=$(echo "$MYSQL_DBS" | jq -r 'length')
        TOTAL_MYSQL=$((TOTAL_MYSQL + MYSQL_COUNT))

        if [ "$MYSQL_COUNT" -gt 0 ]; then
            echo "  MySQL Databases ($MYSQL_COUNT):"
            echo "  ─────────────────────────────────────────────────────────────────"

            for j in $(seq 0 $((MYSQL_COUNT - 1))); do
                DB=$(echo "$MYSQL_DBS" | jq -r ".[$j]")
                DB_NAME=$(echo "$DB" | jq -r '.name')
                DB_DESC=$(echo "$DB" | jq -r '.description')
                DB_VERSION=$(echo "$DB" | jq -r '.version')
                DB_STORAGE=$(echo "$DB" | jq -r '.storageUsageInBytes')
                DB_STORAGE_HR=$(numfmt --to=iec $DB_STORAGE 2>/dev/null || echo "$DB_STORAGE bytes")

                echo "    • $DB_NAME (MySQL $DB_VERSION)"
                echo "      Description: $DB_DESC"
                echo "      Storage: $DB_STORAGE_HR"
                echo ""
            done
        fi
    fi

    # Get Redis databases
    REDIS_DBS=$($MW_CLI database redis list --project-id "$PROJECT_ID" --output json 2>/dev/null)
    if [ $? -eq 0 ]; then
        REDIS_COUNT=$(echo "$REDIS_DBS" | jq -r 'length')
        TOTAL_REDIS=$((TOTAL_REDIS + REDIS_COUNT))

        if [ "$REDIS_COUNT" -gt 0 ]; then
            echo "  Redis Databases ($REDIS_COUNT):"
            echo "  ─────────────────────────────────────────────────────────────────"

            for j in $(seq 0 $((REDIS_COUNT - 1))); do
                DB=$(echo "$REDIS_DBS" | jq -r ".[$j]")
                DB_NAME=$(echo "$DB" | jq -r '.name')
                DB_VERSION=$(echo "$DB" | jq -r '.version')

                echo "    • $DB_NAME (Redis $DB_VERSION)"
                echo ""
            done
        fi
    fi

    # Get project backups
    BACKUPS=$($MW_CLI backup list --project-id "$PROJECT_ID" --output json 2>/dev/null)
    if [ $? -eq 0 ]; then
        BACKUP_COUNT=$(echo "$BACKUPS" | jq -r 'length')
        TOTAL_BACKUPS=$((TOTAL_BACKUPS + BACKUP_COUNT))

        if [ "$BACKUP_COUNT" -gt 0 ]; then
            echo "  Project Backups ($BACKUP_COUNT):"
            echo "  ─────────────────────────────────────────────────────────────────"

            # Show most recent 5 backups
            SHOW_COUNT=$BACKUP_COUNT
            if [ $BACKUP_COUNT -gt 5 ]; then
                SHOW_COUNT=5
            fi

            for j in $(seq 0 $((SHOW_COUNT - 1))); do
                BACKUP=$(echo "$BACKUPS" | jq -r ".[$j]")
                BACKUP_ID=$(echo "$BACKUP" | jq -r '.id')
                BACKUP_DATE=$(echo "$BACKUP" | jq -r '.createdAt')
                BACKUP_EXPIRES=$(echo "$BACKUP" | jq -r '.expiresAt')
                BACKUP_STATUS=$(echo "$BACKUP" | jq -r '.status')

                echo "    • Backup: $(echo $BACKUP_ID | cut -c1-8)... ($BACKUP_STATUS)"
                echo "      Created:  $BACKUP_DATE"
                echo "      Expires:  $BACKUP_EXPIRES"
                echo ""
            done

            if [ $BACKUP_COUNT -gt 5 ]; then
                echo "    ... and $((BACKUP_COUNT - 5)) more backups"
                echo ""
            fi
        else
            echo "  No backups configured for this project"
            echo ""
        fi
    fi

    echo ""
done

# Clean up
rm -f "$TMPFILE"

# Final summary
echo "====================================================================="
echo "                           SUMMARY"
echo "====================================================================="
echo ""
echo "  Total Projects:        $TOTAL_PROJECTS"
echo "  Total MySQL Databases: $TOTAL_MYSQL"
echo "  Total Redis Databases: $TOTAL_REDIS"
echo "  Total Databases:       $((TOTAL_MYSQL + TOTAL_REDIS))"
echo "  Total Backups:         $TOTAL_BACKUPS"
echo ""
echo "====================================================================="
echo "                   Report Generated Successfully"
echo "====================================================================="
