#!/bin/bash
# scripts/setup-local.sh - Foundation setup script for HSA Songbook Local Development

set -e  # Exit on error

echo "🚀 Setting up HSA Songbook Local Development Environment"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop:"
    echo "   macOS/Windows: https://www.docker.com/products/docker-desktop"
    echo "   Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is installed and running"

# Install Supabase CLI based on platform
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install supabase/tap/supabase || {
            echo "❌ Failed to install via Homebrew"
            echo "Manual install: https://supabase.com/docs/guides/cli"
            exit 1
        }
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            # Alternative installation for Linux without Homebrew
            echo "Installing Supabase CLI via direct download..."
            ARCH=$(uname -m)
            if [[ "$ARCH" == "x86_64" ]]; then
                SUPABASE_URL="https://github.com/supabase/cli/releases/download/v1.190.0/supabase_1.190.0_linux_amd64.tar.gz"
            elif [[ "$ARCH" == "aarch64" ]]; then
                SUPABASE_URL="https://github.com/supabase/cli/releases/download/v1.190.0/supabase_1.190.0_linux_arm64.tar.gz"
            else
                echo "Unsupported architecture: $ARCH"
                echo "Please install from: https://github.com/supabase/cli/releases"
                exit 1
            fi
            
            curl -L -o /tmp/supabase.tar.gz "$SUPABASE_URL"
            tar -xzf /tmp/supabase.tar.gz -C /tmp
            sudo mv /tmp/supabase /usr/local/bin/
            rm /tmp/supabase.tar.gz
            echo "✅ Supabase CLI installed successfully"
        fi
    else
        # Windows (Git Bash/WSL)
        echo "Please install Supabase CLI:"
        echo "Scoop: scoop install supabase"
        echo "Or download from: https://github.com/supabase/cli/releases"
        exit 1
    fi
else
    echo "✅ Supabase CLI is already installed (version: $(supabase --version))"
fi

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
    
    # Configure auth settings in config.toml
    echo "📝 Configuring Supabase settings..."
    cat > supabase/config.toml << 'EOF'
# A string used to distinguish different Supabase projects on the same host. Defaults to the
# working directory name when running `supabase init`.
project_id = "hsa-songbook-local"

[api]
enabled = true
# Port to use for the API URL.
port = 54321
# Schemas to expose in your API. Tables, views and stored procedures in this schema will get API
# endpoints. public and storage are always included.
schemas = ["public", "storage", "graphql_public"]
# Extra schemas to add to the search_path of every request. public is always included.
extra_search_path = ["public", "extensions"]
# The maximum number of rows returns from a view, table, or stored procedure. Limits payload size
# for accidental or malicious requests.
max_rows = 1000

[db]
# Port to use for the local database URL.
port = 54322
# Port used by db diff command to initialize the shadow database.
shadow_port = 54320
# The database major version to use. This has to be the same as your remote database's. Run `SHOW
# server_version;` on the remote database to check.
major_version = 15

[db.pooler]
enabled = false
# Port to use for pooler.
port = 54329
# Pooler mode: "transaction" or "session".
pool_mode = "transaction"
# How many server connections to allow per user/database pair.
default_pool_size = 20
# Maximum number of client connections allowed.
max_client_conn = 100

[realtime]
enabled = true
# Bind realtime via either IPv4 or IPv6. (default: IPv6)
ip_version = "IPv6"

[studio]
enabled = true
# Port to use for Supabase Studio.
port = 54323
# External URL of the API server that frontend connects to.
api_url = "http://127.0.0.1"

[auth]
enabled = true
# The base URL of your website. Used as an allow-list for redirects and for constructing URLs used
# in emails.
site_url = "http://localhost:5173"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = ["http://localhost:3000"]
# How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604,800 (1 week).
jwt_expiry = 3600
# If disabled, the refresh token will never expire.
enable_refresh_token_rotation = true
# Allows refresh tokens to be reused after expiry, up to the specified interval in seconds.
# Requires enable_refresh_token_rotation = true.
refresh_token_reuse_interval = 10
# Allow/disallow new user signups to your project.
enable_signup = true

[auth.email]
# Allow/disallow new user signups via email to your project.
enable_signup = true
# If enabled, a user will be required to confirm any email change on both the old, and new email
# addresses. If disabled, only the new email is required to confirm.
double_confirm_changes = false
# If enabled, users need to confirm their email address before signing in.
enable_confirmations = false

[auth.sms]
# Allow/disallow new user signups via SMS to your project.
enable_signup = false
# If enabled, users need to confirm their phone number before signing in.
enable_confirmations = false

[auth.external.apple]
enabled = false
client_id = ""
secret = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
redirect_uri = ""
url = ""

[storage]
enabled = true
# The maximum file size allowed (e.g. "5MB", "500KB").
file_size_limit = "50MiB"

[edge_runtime]
enabled = true
# Configure one of the supported request policies: `oneshot`, `per_worker`.
# Use `oneshot` for hot reload, or `per_worker` for load testing.
policy = "oneshot"
inspector_port = 8083

[analytics]
enabled = false
port = 54327
vector_port = 54328
# Configure one of the supported backends: `postgres`, `bigquery`.
backend = "postgres"
EOF
    echo "✅ Supabase project initialized with custom configuration"
else
    echo "✅ Supabase project already initialized"
fi

# Create environment files from template
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    
    # Update with local Supabase values
    sed -i.bak 's|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=http://localhost:54321|' .env.local
    sed -i.bak 's|VITE_SUPABASE_PUBLISHABLE_KEY=.*|VITE_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key-will-be-updated|' .env.local
    rm .env.local.bak 2>/dev/null || true
    
    echo "⚠️  Note: .env.local created - will be updated with actual keys after starting Supabase"
else
    echo "✅ .env.local already exists"
fi

# Create staging and production environment templates
if [ ! -f ".env.staging" ]; then
    echo "📝 Creating .env.staging template..."
    cp .env.example .env.staging
    sed -i.bak 's|NODE_ENV=.*|NODE_ENV=staging|' .env.staging
    rm .env.staging.bak 2>/dev/null || true
    echo "⚠️  Remember to update .env.staging with your staging Supabase credentials"
fi

if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production template..."
    cp .env.example .env.production
    sed -i.bak 's|NODE_ENV=.*|NODE_ENV=production|' .env.production
    rm .env.production.bak 2>/dev/null || true
    echo "⚠️  Remember to update .env.production with your production Supabase credentials"
fi

# Start local stack
echo ""
echo "🐳 Starting Supabase Docker containers..."
echo "This may take several minutes on first run while downloading images..."
echo ""

# Check if using Podman and set DOCKER_HOST
if command -v podman &> /dev/null && [ -S "/run/user/$(id -u)/podman/podman.sock" ]; then
    export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
    echo "🔧 Detected Podman - using rootless socket"
    # For Podman, use --ignore-health-check flag for better compatibility
    SUPABASE_OUTPUT=$(supabase start --ignore-health-check 2>&1)
else
    # Capture the output to extract credentials
    SUPABASE_OUTPUT=$(supabase start 2>&1)
fi
echo "$SUPABASE_OUTPUT"

# Extract the anon key from the output
ANON_KEY=$(echo "$SUPABASE_OUTPUT" | grep -A1 "anon key" | tail -n1 | tr -d ' ')

if [ ! -z "$ANON_KEY" ] && [ "$ANON_KEY" != "" ]; then
    echo ""
    echo "🔐 Updating .env.local with local credentials..."
    sed -i.bak "s|VITE_SUPABASE_PUBLISHABLE_KEY=.*|VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY|" .env.local
    rm .env.local.bak 2>/dev/null || true
    echo "✅ .env.local updated with local Supabase credentials"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the setup: ./scripts/verify-local.sh"
echo "2. Run the application: npm run dev"
echo "3. Access Supabase Studio: http://localhost:54323"
echo ""
echo "📚 Useful commands:"
echo "  supabase status    - Check service status"
echo "  supabase stop      - Stop all services"
echo "  supabase db reset  - Reset database to initial state"
echo ""
echo "Happy coding! 🎉"