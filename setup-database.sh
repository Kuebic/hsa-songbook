#!/bin/bash

# Setup Database Script for HSA Songbook
# This script applies all database migrations in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}HSA Songbook Database Setup Script${NC}"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Please create a .env file with your Supabase credentials:"
    echo ""
    echo "VITE_SUPABASE_URL=your_supabase_url"
    echo "VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key"
    echo "SUPABASE_DB_URL=your_database_url"
    echo ""
    echo "You can copy from .env.example:"
    echo "cp .env.example .env"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${RED}Error: SUPABASE_DB_URL not found in .env${NC}"
    echo "Please add your Supabase database URL to the .env file"
    echo "Format: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres"
    exit 1
fi

echo "Using database: ${SUPABASE_DB_URL%%@*}@***"
echo ""

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2
    
    echo -n "Applying $description... "
    
    if psql "$SUPABASE_DB_URL" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Error applying $file${NC}"
        psql "$SUPABASE_DB_URL" -f "$file"
        return 1
    fi
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS:    brew install postgresql"
    echo "  Ubuntu:   sudo apt-get install postgresql-client"
    echo "  Windows:  Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Test database connection
echo -n "Testing database connection... "
if psql "$SUPABASE_DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Cannot connect to database. Please check your SUPABASE_DB_URL in .env${NC}"
    exit 1
fi

echo ""
echo "Starting database setup..."
echo "-------------------------"

# Apply migrations in order
echo ""
echo "Step 1: Base Schema"
run_sql "database-schema.sql" "base schema and tables"

echo ""
echo "Step 2: Security Fixes"
run_sql "fix-function-security.sql" "function security patches"
run_sql "fix-view-security.sql" "view security patches"

echo ""
echo "Step 3: RLS Policy Fixes"
run_sql "fix-users-rls-policy.sql" "user RLS policies"

echo ""
echo "-------------------------"
echo -e "${GREEN}Database setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Sign up for a new account or sign in"
echo "3. Your user profile will be automatically created"
echo ""
echo "If you encounter any issues:"
echo "- Check the Supabase dashboard for error logs"
echo "- Ensure Captcha protection is configured correctly"
echo "- Verify email settings in Authentication > Settings"
echo ""

# Optional: Show current RLS policies
echo "Current RLS policies for users table:"
psql "$SUPABASE_DB_URL" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'users';" 2>/dev/null || true