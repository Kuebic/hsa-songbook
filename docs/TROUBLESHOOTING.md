# 🔧 Troubleshooting Guide

This guide covers common issues you may encounter while developing the HSA Songbook application and their solutions.

## Table of Contents

- [Docker Issues](#docker-issues)
- [Port Conflicts](#port-conflicts)
- [Migration Errors](#migration-errors)
- [Type Generation Issues](#type-generation-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Authentication Problems](#authentication-problems)
- [Build & Development Issues](#build--development-issues)
- [Performance Issues](#performance-issues)

---

## Docker Issues

### Docker Daemon Not Running

**Problem:** You see errors like:
```
Cannot connect to the Docker daemon
docker: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
1. **Windows/macOS:** Start Docker Desktop
2. **Linux:** Start Docker service
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
3. **Verify Docker is running:**
   ```bash
   docker info
   ```

**Prevention:** Set Docker to start automatically on system boot.

### Insufficient Docker Resources (Memory)

**Problem:** Supabase containers crash with memory errors or fail to start properly.

**Solution:**
1. **Increase Docker memory allocation:**
   - Docker Desktop → Settings → Resources → Memory
   - Recommended: At least 4GB for full Supabase stack
2. **Free up memory:**
   ```bash
   docker system prune -af
   docker volume prune -f
   ```
3. **Check container resource usage:**
   ```bash
   docker stats
   ```

**Prevention:** Monitor memory usage regularly and clean up unused containers.

### Podman Compatibility Issues

**Problem:** Using Podman instead of Docker causes connection issues.

**Solution:**
1. **Set DOCKER_HOST environment variable:**
   ```bash
   export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
   ```
2. **Use Podman-specific commands:**
   ```bash
   npm run supabase:start  # This includes --ignore-health-check for Podman
   ```
3. **Add to your shell profile (.bashrc, .zshrc):**
   ```bash
   echo 'export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"' >> ~/.bashrc
   ```

**Prevention:** Always use the npm scripts rather than direct Supabase CLI commands.

---

## Port Conflicts

### Port 54321 Already in Use

**Problem:** 
```
Error: Port 54321 is already in use
Failed to start Supabase API server
```

**Solution:**
1. **Find what's using the port:**
   ```bash
   # Linux/macOS
   lsof -i :54321
   netstat -tulpn | grep 54321
   
   # Windows
   netstat -ano | findstr :54321
   ```
2. **Stop the conflicting process:**
   ```bash
   sudo kill -9 <PID>
   ```
3. **Or change Supabase ports in `supabase/config.toml`:**
   ```toml
   [api]
   port = 54331  # Changed from 54321
   
   [db]
   port = 54332  # Changed from 54322
   
   [studio]
   port = 54333  # Changed from 54323
   ```

**Prevention:** Use non-standard ports or stop other development services.

### Multiple Port Conflicts

**Problem:** Several Supabase services can't start due to port conflicts.

**Solution:**
1. **Stop all Supabase instances:**
   ```bash
   npm run supabase:stop
   supabase stop --no-backup
   ```
2. **Check all Supabase ports:**
   ```bash
   # Default ports: 54321-54329
   for port in {54321..54329}; do
     echo "Port $port:"
     lsof -i :$port 2>/dev/null || echo "  Available"
   done
   ```
3. **Update multiple ports in config.toml if needed**

**Prevention:** Use a dedicated port range for development tools.

---

## Migration Errors

### Migration Checksum Mismatch

**Problem:**
```
Migration checksum mismatch for migration 20250121000000_baseline
Expected: abc123..., got: def456...
```

**Solution:**
1. **Reset the database (WARNING: Loses all data):**
   ```bash
   npm run supabase:reset
   ```
2. **Or create a new migration to fix schema differences:**
   ```bash
   npm run db:diff
   supabase migration new fix_schema_differences
   ```
3. **Apply the fix migration:**
   ```bash
   npm run db:migrate
   ```

**Prevention:** 
- Don't manually edit migration files after they've been applied
- Use proper migration workflow for schema changes

### Failed Migration Recovery

**Problem:** A migration failed partway through and left the database in an inconsistent state.

**Solution:**
1. **Check migration status:**
   ```bash
   supabase migration list --local
   ```
2. **Rollback to known good state:**
   ```bash
   npm run migrate:down  # Rollback one migration
   # Or reset completely
   npm run supabase:reset
   ```
3. **Fix the migration and re-apply:**
   ```bash
   # Edit the migration file
   npm run migrate:up
   ```

**Prevention:** Test migrations in a separate database first using `npm run migrate:test`.

### Missing Migration Dependencies

**Problem:** Migration fails due to missing extensions or functions.

**Solution:**
1. **Check required extensions:**
   ```sql
   -- Add to your migration
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";
   ```
2. **Verify extension availability:**
   ```bash
   supabase db shell
   # Then in psql:
   SELECT * FROM pg_available_extensions WHERE name LIKE '%uuid%';
   ```

**Prevention:** Always use `IF NOT EXISTS` clauses for extensions.

---

## Type Generation Issues

### Types Not Updating After Migration

**Problem:** TypeScript types don't reflect recent database schema changes.

**Solution:**
1. **Regenerate types manually:**
   ```bash
   npm run types:generate
   # Or the direct command:
   supabase gen types typescript --local > src/lib/database.types.ts
   ```
2. **Restart TypeScript server in your IDE:**
   - VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
3. **Clear TypeScript cache:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

**Prevention:** Run `npm run types:generate` after every migration.

### Type Generation Fails

**Problem:**
```
Failed to generate types: Connection refused
Could not connect to local Supabase instance
```

**Solution:**
1. **Ensure Supabase is running:**
   ```bash
   npm run supabase:status
   npm run supabase:start  # If not running
   ```
2. **Check database connectivity:**
   ```bash
   supabase db shell  # Should connect successfully
   ```
3. **Manual type generation with verbose output:**
   ```bash
   supabase gen types typescript --local --debug
   ```

**Prevention:** Always generate types with Supabase running.

---

## Platform-Specific Issues

### macOS Issues

**Problem:** Permission denied errors or Apple Silicon compatibility.

**Solution:**
1. **For permission errors:**
   ```bash
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   ```
2. **For Apple Silicon Docker issues:**
   ```bash
   # Use Rosetta for x86 containers if needed
   docker run --platform linux/amd64 <image>
   ```
3. **Install dependencies with correct architecture:**
   ```bash
   npm install --target_arch=arm64  # For M1/M2 Macs
   ```

**Prevention:** Use Homebrew for package management and keep Docker Desktop updated.

### Windows Issues

**Problem:** Line ending conflicts, PowerShell execution policy, or WSL issues.

**Solution:**
1. **Fix line endings:**
   ```bash
   git config --global core.autocrlf input
   # Re-clone the repository
   ```
2. **PowerShell execution policy:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **WSL Docker integration:**
   - Enable "Use the WSL 2 based engine" in Docker Desktop
   - Enable integration with your WSL distro

**Prevention:** Use WSL2 for development and configure Git properly.

### Linux Issues

**Problem:** Permission issues with Docker or missing system dependencies.

**Solution:**
1. **Docker permission issues:**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker  # Or log out and back in
   ```
2. **Install system dependencies:**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install -y curl build-essential
   
   # Fedora
   sudo dnf install -y curl gcc-c++ make
   ```
3. **Node.js version issues:**
   ```bash
   # Use Node Version Manager
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18 && nvm use 18
   ```

**Prevention:** Use a Node version manager and add user to docker group.

---

## Authentication Problems

### Supabase Auth Failures

**Problem:**
```
Invalid JWT token
Auth session expired
```

**Solution:**
1. **Clear browser storage:**
   - Open Developer Tools → Application → Storage
   - Clear localStorage and sessionStorage
2. **Reset auth state:**
   ```bash
   npm run supabase:reset
   npm run dev
   ```
3. **Check auth configuration:**
   ```bash
   # Verify .env.local has correct keys
   cat .env.local | grep SUPABASE
   ```

**Prevention:** Use the latest Supabase client and handle token refresh properly.

### CORS Issues

**Problem:**
```
CORS policy: Request blocked by CORS policy
Access-Control-Allow-Origin missing
```

**Solution:**
1. **Check Supabase auth settings:**
   ```bash
   # In supabase/config.toml
   [auth]
   site_url = "http://localhost:5173"
   additional_redirect_urls = ["http://localhost:3000"]
   ```
2. **Restart Supabase after config changes:**
   ```bash
   npm run supabase:stop
   npm run supabase:start
   ```
3. **Check your local URL matches config:**
   - Frontend: http://localhost:5173
   - API: http://localhost:54321

**Prevention:** Always include your development URLs in Supabase auth configuration.

### Email Confirmation Issues

**Problem:** Users can't sign up because email confirmation isn't working.

**Solution:**
1. **Disable email confirmation for development:**
   ```toml
   # In supabase/config.toml
   [auth.email]
   enable_confirmations = false
   ```
2. **Use the email testing server:**
   - Visit http://localhost:54324 to see emails
3. **Check email configuration:**
   ```bash
   supabase status | grep inbucket
   ```

**Prevention:** Use the local email testing server during development.

---

## Build & Development Issues

### Bundle Size Problems

**Problem:** Build takes too long or bundle is too large.

**Solution:**
1. **Analyze bundle composition:**
   ```bash
   npm run analyze
   # Opens bundle analysis in browser
   ```
2. **Check for large dependencies:**
   ```bash
   npx bundle-analyzer dist/stats.json
   ```
3. **Enable code splitting for large libs:**
   ```javascript
   // In vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'heavy-lib': ['some-large-library']
         }
       }
     }
   }
   ```

**Prevention:** Regularly analyze bundle size and lazy-load heavy components.

### Hot Module Replacement (HMR) Not Working

**Problem:** Changes don't reflect immediately during development.

**Solution:**
1. **Restart dev server:**
   ```bash
   # Kill with Ctrl+C, then:
   npm run dev
   ```
2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```
3. **Check file watching limits (Linux):**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

**Prevention:** Keep file structure clean and avoid circular dependencies.

### ESLint Configuration Issues

**Problem:**
```
Parsing error: Cannot read config file
ESLint configuration is invalid
```

**Solution:**
1. **Fix ESLint config syntax:**
   ```bash
   npx eslint --print-config src/App.tsx
   ```
2. **Reset ESLint cache:**
   ```bash
   rm -rf node_modules/.cache/.eslintcache
   npx eslint --cache --fix .
   ```
3. **Update ESLint dependencies:**
   ```bash
   npm update @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh
   ```

**Prevention:** Keep ESLint plugins updated and test config changes.

---

## Performance Issues

### Slow Database Queries

**Problem:** API responses are slow or timeout.

**Solution:**
1. **Check query performance:**
   ```bash
   supabase db shell
   # In psql:
   EXPLAIN ANALYZE SELECT * FROM songs WHERE title ILIKE '%search%';
   ```
2. **Add missing indexes:**
   ```sql
   CREATE INDEX idx_songs_title_search ON songs USING gin(to_tsvector('english', title));
   ```
3. **Use pagination:**
   ```typescript
   const { data, error } = await supabase
     .from('songs')
     .select('*')
     .range(0, 49)  // Limit to 50 items
   ```

**Prevention:** Profile queries regularly and add indexes for commonly searched fields.

### Memory Leaks in Development

**Problem:** Browser tab becomes slow after extended development.

**Solution:**
1. **Clear React DevTools profiles:**
   - Open React DevTools → Profiler → Clear
2. **Restart dev server periodically:**
   ```bash
   # Every few hours during development
   npm run dev
   ```
3. **Monitor memory usage:**
   - Chrome DevTools → Memory tab → Take heap snapshot

**Prevention:** Close unused browser tabs and restart development server regularly.

### Slow Build Times

**Problem:** `npm run build` takes too long.

**Solution:**
1. **Enable parallel builds:**
   ```bash
   # Use more CPU cores
   npm run build -- --max_old_space_size=4096
   ```
2. **Check for unnecessary dependencies:**
   ```bash
   npx depcheck
   npm uninstall unused-package
   ```
3. **Use build caching:**
   ```bash
   # Clear build cache if needed
   rm -rf dist node_modules/.vite
   npm run build
   ```

**Prevention:** Keep dependencies minimal and use modern, tree-shakeable libraries.

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs:**
   ```bash
   npm run dev 2>&1 | tee debug.log
   npm run supabase:status
   ```

2. **Search existing issues:**
   - Project GitHub issues
   - Supabase GitHub issues
   - Vite GitHub issues

3. **Create a minimal reproduction case:**
   - Isolate the problem
   - Document exact steps to reproduce
   - Include error messages and logs

4. **Community resources:**
   - Supabase Discord: https://discord.supabase.com
   - Vite Discord: https://chat.vitejs.dev
   - Stack Overflow with relevant tags

Remember to include your environment details when asking for help:
- OS and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Docker version (`docker --version`)
- Supabase CLI version (`supabase --version`)

---

## See Also

- 🚀 **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 5 minutes
- 📖 **[README.md](../README.md)** - Project overview and features
- 🎓 **[ONBOARDING.md](./ONBOARDING.md)** - Comprehensive developer guide
- 💡 **[WORKFLOWS.md](./WORKFLOWS.md)** - Step-by-step development workflows
- ⚡ **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Command cheat sheet