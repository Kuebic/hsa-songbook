#!/bin/bash

# test-migrations.sh - Test database migrations in isolation
# Usage: ./scripts/test-migrations.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

echo -e "${CYAN}🧪 Database Migration Testing Suite${NC}"
echo "======================================="

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

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}Running: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}  ❌ FAILED${NC}"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Function to check table exists
check_table_exists() {
    local table_name=$1
    supabase db query "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name');" --local 2>/dev/null | grep -q "true"
}

# Function to check column exists
check_column_exists() {
    local table_name=$1
    local column_name=$2
    supabase db query "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table_name' AND column_name = '$column_name');" --local 2>/dev/null | grep -q "true"
}

# Function to check index exists
check_index_exists() {
    local index_name=$1
    supabase db query "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = '$index_name');" --local 2>/dev/null | grep -q "true"
}

# Function to check RLS enabled
check_rls_enabled() {
    local table_name=$1
    supabase db query "SELECT relrowsecurity FROM pg_class WHERE relname = '$table_name' AND relnamespace = 'public'::regnamespace;" --local 2>/dev/null | grep -q "true"
}

# Function to check policy exists
check_policy_exists() {
    local table_name=$1
    local policy_name=$2
    supabase db query "SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '$table_name' AND policyname = '$policy_name');" --local 2>/dev/null | grep -q "true"
}

echo ""
echo -e "${YELLOW}📋 Test 1: Migration File Validation${NC}"
echo "-------------------------------------"

# Check migration files exist
run_test "Migration files exist" "ls supabase/migrations/*.sql > /dev/null 2>&1"

# Check migration naming convention
run_test "Migration naming convention" "ls supabase/migrations/*.sql | grep -E '[0-9]{14}_.*\.sql$' > /dev/null"

# Check for SQL syntax errors
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        migration_name=$(basename "$migration")
        run_test "Syntax check: $migration_name" "supabase db lint '$migration' 2>/dev/null"
    fi
done

echo ""
echo -e "${YELLOW}📋 Test 2: Fresh Database Reset${NC}"
echo "--------------------------------"

# Stop Supabase for clean state
echo -e "${YELLOW}⏸️  Stopping Supabase...${NC}"
supabase stop > /dev/null 2>&1

# Start Supabase
echo -e "${YELLOW}▶️  Starting Supabase...${NC}"
supabase start > /dev/null 2>&1

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services...${NC}"
sleep 5

# Reset database
run_test "Database reset" "supabase db reset > /dev/null 2>&1"

echo ""
echo -e "${YELLOW}📋 Test 3: Schema Verification${NC}"
echo "------------------------------"

# Test core tables exist
CORE_TABLES=("users" "songs" "arrangements" "setlists" "setlist_items" "reviews" "user_roles" "content_reports" "moderation_log" "role_audit_log")

for table in "${CORE_TABLES[@]}"; do
    run_test "Table exists: $table" "check_table_exists '$table'"
done

echo ""
echo -e "${YELLOW}📋 Test 4: Column Verification${NC}"
echo "------------------------------"

# Test critical columns
run_test "songs.id column" "check_column_exists 'songs' 'id'"
run_test "songs.title column" "check_column_exists 'songs' 'title'"
run_test "songs.slug column" "check_column_exists 'songs' 'slug'"
run_test "arrangements.chord_data column" "check_column_exists 'arrangements' 'chord_data'"
run_test "users.email column" "check_column_exists 'users' 'email'"

echo ""
echo -e "${YELLOW}📋 Test 5: Index Verification${NC}"
echo "-----------------------------"

# Test critical indexes
CRITICAL_INDEXES=("idx_songs_slug" "idx_songs_title" "idx_arrangements_song_id" "idx_users_email")

for index in "${CRITICAL_INDEXES[@]}"; do
    run_test "Index exists: $index" "check_index_exists '$index'"
done

echo ""
echo -e "${YELLOW}📋 Test 6: RLS Policy Verification${NC}"
echo "----------------------------------"

# Test RLS is enabled on tables
for table in "${CORE_TABLES[@]}"; do
    run_test "RLS enabled: $table" "check_rls_enabled '$table'"
done

echo ""
echo -e "${YELLOW}📋 Test 7: Foreign Key Constraints${NC}"
echo "----------------------------------"

# Test foreign key constraints
run_test "arrangements.song_id FK" "supabase db query \"SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'arrangements' AND constraint_name LIKE '%song_id%');\" --local 2>/dev/null | grep -q 'true'"

run_test "setlist_items.setlist_id FK" "supabase db query \"SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'setlist_items' AND constraint_name LIKE '%setlist_id%');\" --local 2>/dev/null | grep -q 'true'"

echo ""
echo -e "${YELLOW}📋 Test 8: Views Verification${NC}"
echo "-----------------------------"

# Test views exist
VIEWS=("song_stats" "songs_with_alt_titles" "user_stats")

for view in "${VIEWS[@]}"; do
    run_test "View exists: $view" "supabase db query \"SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = '$view');\" --local 2>/dev/null | grep -q 'true'"
done

echo ""
echo -e "${YELLOW}📋 Test 9: Functions Verification${NC}"
echo "---------------------------------"

# Test functions exist
FUNCTIONS=("check_admin_role" "generate_share_id" "update_updated_at_column")

for func in "${FUNCTIONS[@]}"; do
    run_test "Function exists: $func" "supabase db query \"SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = '$func');\" --local 2>/dev/null | grep -q 'true'"
done

echo ""
echo -e "${YELLOW}📋 Test 10: Seed Data Application${NC}"
echo "---------------------------------"

# Test seed data was applied
run_test "Seed users created" "supabase db query 'SELECT COUNT(*) > 0 as has_users FROM public.users;' --local 2>/dev/null | grep -q 'true'"

run_test "Seed songs created" "supabase db query 'SELECT COUNT(*) > 0 as has_songs FROM public.songs;' --local 2>/dev/null | grep -q 'true'"

run_test "Seed arrangements created" "supabase db query 'SELECT COUNT(*) > 0 as has_arrangements FROM public.arrangements;' --local 2>/dev/null | grep -q 'true'"

echo ""
echo -e "${YELLOW}📋 Test 11: Type Generation${NC}"
echo "---------------------------"

# Generate types
run_test "Type generation" "./scripts/generate-types.sh > /dev/null 2>&1"

# Check types file exists and has content
run_test "Types file exists" "[ -f 'src/lib/database.types.ts' ]"
run_test "Types file has content" "[ -s 'src/lib/database.types.ts' ]"
run_test "Types contain tables" "grep -q 'Tables: {' src/lib/database.types.ts"

echo ""
echo -e "${YELLOW}📋 Test 12: Migration Idempotency${NC}"
echo "---------------------------------"

# Test that migrations can be applied multiple times safely
run_test "Second reset (idempotency)" "supabase db reset > /dev/null 2>&1"

# Verify schema still intact after second reset
run_test "Tables intact after second reset" "check_table_exists 'songs'"

echo ""
echo "======================================="
echo -e "${CYAN}📊 Test Summary${NC}"
echo "======================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}• $test${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 Debug tips:${NC}"
    echo "  1. Check migration files for syntax errors"
    echo "  2. Run 'supabase db reset' manually to see detailed errors"
    echo "  3. Check 'supabase/migrations/*.sql' for proper SQL syntax"
    echo "  4. Verify Supabase is running: 'supabase status'"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ All tests passed! Migrations are working correctly.${NC}"
fi