#!/bin/bash

# migrate-down.sh - Rollback database migrations
# Usage: ./scripts/migrate-down.sh [migration_name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  Database Migration Rollback${NC}"
echo -e "${RED}WARNING: This will reset your database and lose all data!${NC}"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI not found${NC}"
    echo "Please install Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Function to create a rollback migration
create_rollback_migration() {
    local migration_to_revert=$1
    
    if [ -z "$migration_to_revert" ]; then
        echo -e "${RED}❌ Error: No migration name provided${NC}"
        echo "Usage: $0 [migration_name]"
        echo ""
        echo "Available migrations:"
        ls -1 supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | sed 's/^/  - /'
        exit 1
    fi
    
    # Check if migration file exists
    if [ ! -f "supabase/migrations/$migration_to_revert" ]; then
        echo -e "${RED}❌ Error: Migration file not found: $migration_to_revert${NC}"
        echo ""
        echo "Available migrations:"
        ls -1 supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | sed 's/^/  - /'
        exit 1
    fi
    
    # Generate timestamp for new rollback migration
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    ROLLBACK_NAME="revert_$(echo $migration_to_revert | sed 's/^[0-9]*_//')"
    ROLLBACK_FILE="supabase/migrations/${TIMESTAMP}_${ROLLBACK_NAME}"
    
    echo -e "${BLUE}📝 Creating rollback migration: ${ROLLBACK_FILE}${NC}"
    
    # Create rollback migration template
    cat > "$ROLLBACK_FILE" << EOF
-- Rollback migration for: $migration_to_revert
-- Generated on: $(date)
-- 
-- IMPORTANT: Review and edit this file before applying!
-- This is a template that needs to be customized based on the original migration.

BEGIN;

-- TODO: Add your rollback SQL here
-- Examples:

-- Drop table (if created in original migration)
-- DROP TABLE IF EXISTS public.table_name CASCADE;

-- Drop column (if added in original migration)
-- ALTER TABLE public.table_name DROP COLUMN IF EXISTS column_name;

-- Drop index (if created in original migration)
-- DROP INDEX IF EXISTS idx_name;

-- Drop function (if created in original migration)
-- DROP FUNCTION IF EXISTS function_name(params);

-- Revert column type change
-- ALTER TABLE public.table_name ALTER COLUMN column_name TYPE original_type;

-- Remove constraint (if added in original migration)
-- ALTER TABLE public.table_name DROP CONSTRAINT IF EXISTS constraint_name;

COMMIT;
EOF
    
    echo -e "${GREEN}✅ Rollback migration template created: ${ROLLBACK_FILE}${NC}"
    echo -e "${YELLOW}⚠️  Please edit the file to add appropriate rollback SQL${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Edit the rollback migration file"
    echo "2. Test with: supabase db reset"
    echo "3. Apply with: ./scripts/migrate-up.sh"
}

# Function to perform hard reset
perform_hard_reset() {
    echo -e "${RED}⚠️  This will completely reset your database!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Rollback cancelled${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🔄 Performing database reset...${NC}"
    
    # Stop and restart Supabase to ensure clean state
    echo -e "${YELLOW}⏸️  Stopping Supabase...${NC}"
    supabase stop
    
    echo -e "${YELLOW}▶️  Starting Supabase...${NC}"
    supabase start
    
    # Wait for services
    echo -e "${YELLOW}⏳ Waiting for services...${NC}"
    sleep 5
    
    # Reset database
    echo -e "${YELLOW}🔄 Resetting database...${NC}"
    supabase db reset
    
    # Generate types
    echo -e "${GREEN}🏷️  Regenerating TypeScript types...${NC}"
    supabase gen types typescript --local > src/lib/database.types.ts
    
    echo -e "${GREEN}✅ Database reset complete!${NC}"
}

# Main logic
if [ $# -eq 0 ]; then
    echo ""
    echo "Options:"
    echo "1. Create a rollback migration for a specific migration"
    echo "2. Perform a hard reset (removes all data and reapplies all migrations)"
    echo ""
    read -p "Choose an option (1 or 2): " option
    
    case $option in
        1)
            echo ""
            echo "Available migrations:"
            ls -1 supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | sed 's/^/  - /'
            echo ""
            read -p "Enter migration filename to revert: " migration_name
            create_rollback_migration "$migration_name"
            ;;
        2)
            perform_hard_reset
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
else
    # If migration name provided as argument, create rollback migration
    create_rollback_migration "$1"
fi