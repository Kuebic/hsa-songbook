#!/bin/bash
# scripts/verify-local.sh - Verification script for HSA Songbook local development

set -e  # Exit on error

echo "🔍 Verifying HSA Songbook Local Development Environment"
echo "========================================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
VERIFICATION_PASSED=true

# Function to check a requirement
check_requirement() {
    local name="$1"
    local command="$2"
    local success_msg="$3"
    local fail_msg="$4"
    
    echo -n "Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $success_msg"
        return 0
    else
        echo -e "${RED}✗${NC} $fail_msg"
        VERIFICATION_PASSED=false
        return 1
    fi
}

# Function to check port availability
check_port() {
    local port="$1"
    local service="$2"
    
    echo -n "Checking port $port for $service... "
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $port is in use (expected for running service)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Port $port is not in use (service may not be running)"
        return 1
    fi
}

echo ""
echo "1️⃣  Prerequisites Check"
echo "------------------------"

# Check Docker
check_requirement "Docker installation" \
    "docker --version" \
    "Docker is installed" \
    "Docker not found. Please install Docker Desktop"

check_requirement "Docker daemon" \
    "docker info" \
    "Docker daemon is running" \
    "Docker daemon is not running. Please start Docker Desktop"

# Check Supabase CLI
check_requirement "Supabase CLI" \
    "supabase --version" \
    "Supabase CLI is installed ($(supabase --version 2>/dev/null))" \
    "Supabase CLI not found. Please run ./scripts/setup-local.sh"

# Check Node.js and npm
check_requirement "Node.js" \
    "node --version" \
    "Node.js is installed ($(node --version 2>/dev/null))" \
    "Node.js not found"

check_requirement "npm" \
    "npm --version" \
    "npm is installed ($(npm --version 2>/dev/null))" \
    "npm not found"

echo ""
echo "2️⃣  Supabase Configuration"
echo "---------------------------"

# Check Supabase config file
check_requirement "Supabase config" \
    "test -f supabase/config.toml" \
    "config.toml exists" \
    "config.toml not found. Run: supabase init"

# Check environment files
check_requirement ".env.local file" \
    "test -f .env.local" \
    ".env.local exists" \
    ".env.local not found. Run: cp .env.example .env.local"

echo ""
echo "3️⃣  Supabase Services Status"
echo "-----------------------------"

# Check if Supabase is running
if supabase status > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Supabase stack is running"
    
    # Check individual services
    echo ""
    echo "Service Status:"
    supabase status | grep -E "API|Database|Studio|Storage|Auth" | while read line; do
        if echo "$line" | grep -q "running\|RUNNING"; then
            echo -e "  ${GREEN}✓${NC} $line"
        else
            echo -e "  ${RED}✗${NC} $line"
            VERIFICATION_PASSED=false
        fi
    done
    
    echo ""
    echo "4️⃣  Port Availability"
    echo "---------------------"
    
    check_port 54321 "Supabase API"
    check_port 54322 "PostgreSQL Database"
    check_port 54323 "Supabase Studio"
    
else
    echo -e "${YELLOW}⚠${NC} Supabase stack is not running"
    echo "  Run: supabase start"
    
    echo ""
    echo "4️⃣  Port Availability (for when Supabase starts)"
    echo "-------------------------------------------------"
    
    # Check if ports are available
    for port in 54321 54322 54323; do
        echo -n "Checking port $port availability... "
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "${RED}✗${NC} Port $port is already in use"
            VERIFICATION_PASSED=false
        else
            echo -e "${GREEN}✓${NC} Port $port is available"
        fi
    done
fi

echo ""
echo "5️⃣  Application Configuration"
echo "------------------------------"

# Check if environment variables are set properly in .env.local
if [ -f .env.local ]; then
    if grep -q "VITE_SUPABASE_URL=http://localhost:54321" .env.local; then
        echo -e "${GREEN}✓${NC} Local Supabase URL is configured"
    else
        echo -e "${YELLOW}⚠${NC} Local Supabase URL may not be configured correctly"
    fi
    
    if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY=.*" .env.local && \
       ! grep -q "VITE_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key-will-be-updated" .env.local; then
        echo -e "${GREEN}✓${NC} Supabase anon key is configured"
    else
        echo -e "${YELLOW}⚠${NC} Supabase anon key needs to be updated"
        echo "    Run: supabase start (to get the anon key)"
    fi
fi

# Check node_modules
check_requirement "Dependencies" \
    "test -d node_modules" \
    "Dependencies are installed" \
    "Dependencies not installed. Run: npm install"

echo ""
echo "6️⃣  Quick Connection Test"
echo "-------------------------"

# If Supabase is running, test the connection
if supabase status > /dev/null 2>&1; then
    if curl -f http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Supabase API is responding"
    else
        echo -e "${RED}✗${NC} Supabase API is not responding"
        VERIFICATION_PASSED=false
    fi
    
    if curl -f http://localhost:54323 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Supabase Studio is accessible"
    else
        echo -e "${YELLOW}⚠${NC} Supabase Studio may not be accessible"
    fi
fi

echo ""
echo "========================================================="
echo ""

if [ "$VERIFICATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your local development environment is ready. You can now:"
    echo "  1. Start the application: npm run dev"
    echo "  2. Access Supabase Studio: http://localhost:54323"
    echo "  3. View your app: http://localhost:5173"
    exit 0
else
    echo -e "${RED}❌ Some checks failed.${NC}"
    echo ""
    echo "Please address the issues above and run this script again."
    echo "For help, refer to the setup documentation or run:"
    echo "  ./scripts/setup-local.sh"
    exit 1
fi