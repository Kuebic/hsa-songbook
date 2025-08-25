#!/bin/bash

# migrate-up.sh - Apply database migrations to local Supabase instance
# Usage: ./scripts/migrate-up.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Applying database migrations...${NC}"

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

# Check if Supabase is running
echo -e "${YELLOW}⚙️  Checking Supabase status...${NC}"
if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
    echo -e "${YELLOW}⚠️  Starting Supabase...${NC}"
    supabase start
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 5
fi

# List current migrations
echo -e "${GREEN}📋 Current migration status:${NC}"
supabase migration list --local

# Apply migrations
echo -e "${GREEN}📝 Applying pending migrations...${NC}"
supabase migration up --local

# Show updated migration status
echo -e "${GREEN}✅ Migration status after apply:${NC}"
supabase migration list --local

# Generate updated TypeScript types
echo -e "${GREEN}🏷️  Generating TypeScript types...${NC}"
supabase gen types typescript --local > src/lib/database.types.ts

# Check if types were generated successfully
if [ -f "src/lib/database.types.ts" ]; then
    echo -e "${GREEN}✅ TypeScript types generated successfully${NC}"
    
    # Show a summary of tables in the generated types
    echo -e "${GREEN}📊 Tables in generated types:${NC}"
    grep -o "^\s*[a-z_]*:" src/lib/database.types.ts | grep -v "^$" | head -20 | sed 's/://g' | sed 's/^/  - /'
else
    echo -e "${RED}❌ Error: Failed to generate TypeScript types${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migrations applied successfully!${NC}"
echo -e "${YELLOW}💡 Tip: Run 'npm run build' to ensure TypeScript compilation works with new types${NC}"