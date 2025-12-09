#!/bin/bash
# Mittwald Backup Status Report
# Using Mittwald CLI to generate comprehensive backup information

export MITTWALD_API_TOKEN="699b1b90-5476-44b8-a504-f491ea771814:0VtMXEbKm-Ub7pLWGc-VCbDJrkzC41SNMSo1AWJsDMI:mittwald_a"
MW_CLI="/Users/robert/Code/mittwald-mcp/node_modules/.bin/mw"

echo "====================================================================="
echo "          MITTWALD BACKUP STATUS REPORT"
echo "          Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "====================================================================="
echo ""

# Get all projects
echo "Fetching projects..."
PROJECTS=$($MW_CLI project list --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch projects"
    exit 1
fi

TOTAL_PROJECTS=$(echo "$PROJECTS" | jq length)
echo "Found $TOTAL_PROJECTS projects"
echo ""

TOTAL_DATABASES=0
TOTAL_BACKUPS=0

# Process each project
echo "$PROJECTS" | jq -c '.[]' | while read -r project; do
    PROJECT_ID=$(echo "$project" | jq -r '.id')
    PROJECT_SHORT_ID=$(echo "$project" | jq -r '.shortId')
    PROJECT_NAME=$(echo "$project" | jq -r '.description')
    BACKUP_STORAGE=$(echo "$project" | jq -r '.backupStorageUsageInBytes')

    echo "---------------------------------------------------------------------"
    echo "PROJECT: $PROJECT_NAME"
    echo "  Short ID: $PROJECT_SHORT_ID"
    echo "  Full ID:  $PROJECT_ID"
    echo "  Backup Storage: $BACKUP_STORAGE bytes ($(numfmt --to=iec $BACKUP_STORAGE 2>/dev/null || echo $BACKUP_STORAGE))"
    echo ""

    # Get MySQL databases for this project
    echo "  Checking MySQL databases..."
    DATABASES=$($MW_CLI database mysql list --project-id "$PROJECT_ID" --output json 2>/dev/null)

    if [ $? -eq 0 ]; then
        DB_COUNT=$(echo "$DATABASES" | jq length)
        echo "  Found $DB_COUNT MySQL database(s)"

        if [ "$DB_COUNT" -gt 0 ]; then
            TOTAL_DATABASES=$((TOTAL_DATABASES + DB_COUNT))

            echo "$DATABASES" | jq -c '.[]' | while read -r database; do
                DB_ID=$(echo "$database" | jq -r '.id')
                DB_NAME=$(echo "$database" | jq -r '.name')
                DB_DESC=$(echo "$database" | jq -r '.description')
                DB_VERSION=$(echo "$database" | jq -r '.version')
                DB_STORAGE=$(echo "$database" | jq -r '.storageUsageInBytes')

                echo ""
                echo "    DATABASE: $DB_NAME"
                echo "      Description: $DB_DESC"
                echo "      Version: MySQL $DB_VERSION"
                echo "      Storage: $DB_STORAGE bytes"
                echo "      Database ID: $DB_ID"

                # Try to get backups for this database
                echo "      Checking backups..."
                BACKUPS=$($MW_CLI backup list --database-id "$DB_ID" --output json 2>/dev/null)

                if [ $? -eq 0 ]; then
                    BACKUP_COUNT=$(echo "$BACKUPS" | jq length 2>/dev/null || echo 0)

                    if [ "$BACKUP_COUNT" -gt 0 ]; then
                        echo "      Found $BACKUP_COUNT backup(s):"
                        TOTAL_BACKUPS=$((TOTAL_BACKUPS + BACKUP_COUNT))

                        echo "$BACKUPS" | jq -c '.[]' | while read -r backup; do
                            BACKUP_ID=$(echo "$backup" | jq -r '.id')
                            BACKUP_DATE=$(echo "$backup" | jq -r '.createdAt')
                            BACKUP_SIZE=$(echo "$backup" | jq -r '.size // "N/A"')

                            echo "        - Backup ID: $BACKUP_ID"
                            echo "          Date: $BACKUP_DATE"
                            echo "          Size: $BACKUP_SIZE"
                        done
                    else
                        echo "      No backups found"
                    fi
                else
                    echo "      Unable to fetch backups (may not be supported for this database)"
                fi
            done
        fi
    else
        echo "  No MySQL databases or permission denied"
    fi

    # Check Redis databases
    echo ""
    echo "  Checking Redis databases..."
    REDIS_DBS=$($MW_CLI database redis list --project-id "$PROJECT_ID" --output json 2>/dev/null)

    if [ $? -eq 0 ]; then
        REDIS_COUNT=$(echo "$REDIS_DBS" | jq length)
        echo "  Found $REDIS_COUNT Redis database(s)"

        if [ "$REDIS_COUNT" -gt 0 ]; then
            TOTAL_DATABASES=$((TOTAL_DATABASES + REDIS_COUNT))

            echo "$REDIS_DBS" | jq -c '.[]' | while read -r database; do
                DB_ID=$(echo "$database" | jq -r '.id')
                DB_NAME=$(echo "$database" | jq -r '.name // .id')
                DB_VERSION=$(echo "$database" | jq -r '.version')

                echo ""
                echo "    REDIS DATABASE: $DB_NAME"
                echo "      Version: Redis $DB_VERSION"
                echo "      Database ID: $DB_ID"
            done
        fi
    else
        echo "  No Redis databases or permission denied"
    fi

    echo ""
done

echo "====================================================================="
echo "SUMMARY"
echo "====================================================================="
echo "Total Projects:  $TOTAL_PROJECTS"
echo "Total Databases: $TOTAL_DATABASES"
echo "Total Backups:   $TOTAL_BACKUPS"
echo ""
echo "Report generated successfully"
echo "====================================================================="
