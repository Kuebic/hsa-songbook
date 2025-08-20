#!/bin/bash

# Setup Supabase Database Schema
# This script helps you set up the database tables in your Supabase project

echo "🚀 Supabase Database Setup Script"
echo "================================="
echo ""
echo "This will create all necessary tables in your Supabase database."
echo ""
echo "Prerequisites:"
echo "1. You have a Supabase project created"
echo "2. You have your project URL and service role key"
echo ""

# Check if database-schema.sql exists
if [ ! -f "database-schema.sql" ]; then
    echo "❌ Error: database-schema.sql not found!"
    echo "Please ensure you're running this from the project root directory."
    exit 1
fi

echo "📋 Instructions:"
echo ""
echo "1. Go to your Supabase Dashboard: https://app.supabase.com"
echo "2. Select your project: cjegmbpyjunitoqqxjbz"
echo "3. Click on 'SQL Editor' in the left sidebar"
echo "4. Click 'New Query'"
echo "5. Copy and paste the contents of database-schema.sql"
echo "6. Click 'Run' to execute the schema"
echo ""
echo "Alternatively, you can use the Supabase CLI:"
echo ""
echo "npx supabase db push database-schema.sql --project-ref cjegmbpyjunitoqqxjbz"
echo ""
echo "After running the schema, you should see these tables in your database:"
echo "  ✅ users"
echo "  ✅ songs"
echo "  ✅ arrangements"
echo "  ✅ setlists"
echo "  ✅ setlist_items"
echo "  ✅ reviews"
echo ""
echo "🔍 To verify the tables were created:"
echo "1. Go to the 'Table Editor' in your Supabase dashboard"
echo "2. You should see all the tables listed above"
echo ""
echo "📝 Next steps after schema creation:"
echo "1. Set up Authentication providers (Google, GitHub) in Supabase Auth settings"
echo "2. Run the migration script: npm run migrate:supabase"
echo "3. Test the application: npm run dev"
echo ""
echo "Press Enter to open the SQL file for copying..."
read -r

# Show the SQL file
cat database-schema.sql

echo ""
echo "✅ Copy the above SQL and paste it into the Supabase SQL Editor!"
echo ""
echo "Need help? Check the documentation at https://supabase.com/docs"