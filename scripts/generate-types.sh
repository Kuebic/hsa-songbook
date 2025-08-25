#!/bin/bash

# generate-types.sh - Generate TypeScript types from Supabase schema
# Usage: ./scripts/generate-types.sh [--remote]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TYPES_FILE="src/lib/database.types.ts"
BACKUP_DIR=".types-backup"

echo -e "${GREEN}🏷️  TypeScript Type Generation${NC}"

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

# Parse arguments
REMOTE_MODE=false
if [ "$1" == "--remote" ]; then
    REMOTE_MODE=true
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup existing types file
if [ -f "$TYPES_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/database.types.$(date +%Y%m%d_%H%M%S).ts"
    echo -e "${YELLOW}📦 Backing up existing types to: $BACKUP_FILE${NC}"
    cp "$TYPES_FILE" "$BACKUP_FILE"
    
    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/database.types.*.ts 2>/dev/null | tail -n +6 | xargs -r rm
fi

# Generate types based on mode
if [ "$REMOTE_MODE" == true ]; then
    echo -e "${BLUE}🌐 Generating types from remote database...${NC}"
    
    # Check if project is linked
    if ! supabase projects list 2>&1 | grep -q "●"; then
        echo -e "${RED}❌ Error: No project linked${NC}"
        echo "Run 'supabase link' first to connect to your remote project"
        exit 1
    fi
    
    # Generate from remote
    echo -e "${YELLOW}⏳ Fetching schema from remote database...${NC}"
    supabase gen types typescript --linked > "$TYPES_FILE"
    
    echo -e "${GREEN}✅ Types generated from remote database${NC}"
else
    echo -e "${BLUE}💻 Generating types from local database...${NC}"
    
    # Check if Supabase is running
    if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
        echo -e "${YELLOW}⚠️  Supabase not running. Starting...${NC}"
        supabase start
        sleep 5
    fi
    
    # Generate from local
    supabase gen types typescript --local > "$TYPES_FILE"
    
    echo -e "${GREEN}✅ Types generated from local database${NC}"
fi

# Verify the generated file
if [ ! -f "$TYPES_FILE" ] || [ ! -s "$TYPES_FILE" ]; then
    echo -e "${RED}❌ Error: Generated types file is empty or missing${NC}"
    
    # Restore from backup if available
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${YELLOW}🔄 Restoring from backup...${NC}"
        cp "$BACKUP_FILE" "$TYPES_FILE"
    fi
    exit 1
fi

# Extract and display table information
echo -e "${GREEN}📊 Generated types summary:${NC}"

# Count tables
TABLE_COUNT=$(grep -c "Row: {" "$TYPES_FILE" 2>/dev/null || echo "0")
echo -e "  ${BLUE}Tables:${NC} $TABLE_COUNT"

# List main tables (first 10)
echo -e "  ${BLUE}Main tables:${NC}"
grep -B2 "Row: {" "$TYPES_FILE" 2>/dev/null | grep ":" | grep -v "Row:" | head -10 | sed 's/://g' | sed 's/^/    - /' || echo "    No tables found"

# Count views
VIEW_COUNT=$(grep -c "Views: {" "$TYPES_FILE" 2>/dev/null || echo "0")
if [ "$VIEW_COUNT" -gt 0 ]; then
    echo -e "  ${BLUE}Views:${NC} Found"
fi

# Count functions
FUNCTION_COUNT=$(grep -c "Functions: {" "$TYPES_FILE" 2>/dev/null || echo "0")
if [ "$FUNCTION_COUNT" -gt 0 ]; then
    echo -e "  ${BLUE}Functions:${NC} Found"
fi

# Check TypeScript compilation
echo -e "${YELLOW}🔍 Checking TypeScript compilation...${NC}"
if command -v npx &> /dev/null && [ -f "tsconfig.json" ]; then
    # Create a temporary test file
    TEST_FILE="src/lib/test-types.ts"
    cat > "$TEST_FILE" << EOF
import type { Database } from './database.types'

// Test that types are properly generated
type TestTables = Database['public']['Tables']
type TestSongs = TestTables extends { songs: any } ? TestTables['songs'] : never
type TestArrangements = TestTables extends { arrangements: any } ? TestTables['arrangements'] : never

export const typeCheck: boolean = true
EOF
    
    # Try to compile the test file
    if npx tsc --noEmit "$TEST_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${YELLOW}⚠️  TypeScript compilation warnings detected${NC}"
        echo "Run 'npm run build' to see detailed errors"
    fi
    
    # Clean up test file
    rm -f "$TEST_FILE"
else
    echo -e "${YELLOW}⚠️  Skipping TypeScript check (tsc not available)${NC}"
fi

# Show git diff if available
if command -v git &> /dev/null && [ -f "$TYPES_FILE" ]; then
    if git diff --stat "$TYPES_FILE" 2>/dev/null | grep -q "database.types.ts"; then
        echo -e "${YELLOW}📝 Changes detected in types file:${NC}"
        git diff --stat "$TYPES_FILE"
        echo -e "${YELLOW}💡 Tip: Review changes with 'git diff $TYPES_FILE'${NC}"
    else
        echo -e "${GREEN}ℹ️  No changes in types file${NC}"
    fi
fi

echo -e "${GREEN}✅ Type generation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the generated types: $TYPES_FILE"
echo "  2. Run 'npm run build' to verify TypeScript compilation"
echo "  3. Commit the updated types file if changes look correct"