# Troubleshooting Guide

This document covers common issues and their solutions when running the TrustKart application.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Connection Issues](#database-connection-issues)
3. [Environment Variable Issues](#environment-variable-issues)
4. [Build and Runtime Errors](#build-and-runtime-errors)
5. [Port and Network Issues](#port-and-network-issues)
6. [Prisma Issues](#prisma-issues)
7. [Supabase Issues](#supabase-issues)

## Installation Issues

### Issue: `npm install` fails

**Symptoms:**
- Error messages during `npm install`
- Missing dependencies
- Permission errors

**Solutions:**

1. **Clear cache and reinstall:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node.js version:**
```bash
node --version  # Should be v18 or higher
```

3. **Use npm instead of yarn (or vice versa):**
```bash
# If using yarn
yarn install

# If using npm
npm install
```

4. **Windows-specific:**
   - Run PowerShell/Command Prompt as Administrator
   - Disable antivirus temporarily
   - Check if path is too long (Windows has 260 char limit)

### Issue: TypeScript errors during installation

**Solution:**
```bash
npm install --legacy-peer-deps
```

## Database Connection Issues

### Issue: "Database connection failed" or "Connection timeout"

**Symptoms:**
- Error messages about database connection
- Timeout errors
- "ECONNREFUSED" errors

**Solutions:**

1. **Verify Supabase project is active:**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Check project status
   - Ensure project is not paused

2. **Check DATABASE_URL format:**
```env
# Correct format (Transaction pooler)
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true"

# Direct connection (if pooler doesn't work)
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
```

3. **Test connection:**
   - Visit: `http://localhost:9002/database-setup-complete`
   - Click "Test Connection"
   - Check browser console for detailed errors

4. **Verify credentials:**
   - Check `.env` file has correct values
   - Ensure password is URL-encoded (e.g., `@` becomes `%40`)
   - Verify project reference in URL matches your project

### Issue: "Table does not exist" or "Relation does not exist"

**Solutions:**

1. **Run database setup:**
```bash
npm run db:push
```

2. **Or run SQL scripts manually:**
   - Go to Supabase SQL Editor
   - Run `SAFE-DATABASE-SETUP.sql`
   - Run `FIX-SCHEMA-RELATIONSHIPS.sql`

3. **Check if tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Environment Variable Issues

### Issue: "Environment variables not set"

**Symptoms:**
- Console errors about missing env variables
- Application fails to connect to Supabase
- Features not working

**Solutions:**

1. **Verify .env file exists:**
```bash
# Check if .env exists in tk-main directory
ls -la tk-main/.env  # Mac/Linux
dir tk-main\.env     # Windows
```

2. **Create .env from template:**
```bash
cd tk-main
cp env.example .env
```

3. **Check variable names:**
   - Must start with `NEXT_PUBLIC_` for client-side variables
   - No spaces around `=`
   - Use quotes for values with special characters

4. **Restart development server:**
   - Environment variables are loaded at startup
   - Stop server (Ctrl+C) and restart: `npm run dev`

5. **Verify in browser:**
   - Visit: `http://localhost:9002/environment-check`
   - Check which variables are missing

### Issue: "Invalid API key" or "Authentication failed"

**Solutions:**

1. **Regenerate Supabase keys:**
   - Go to Supabase Dashboard → Settings → API
   - Copy fresh keys
   - Update `.env` file
   - Restart server

2. **Check key format:**
   - Keys should be long JWT tokens
   - No extra spaces or quotes
   - Copy entire key including `eyJ...`

## Build and Runtime Errors

### Issue: "Module not found" errors

**Symptoms:**
- `Cannot find module '@/components/...'`
- Import errors
- Type errors

**Solutions:**

1. **Check TypeScript paths:**
   - Verify `tsconfig.json` has correct paths:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

2. **Reinstall dependencies:**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

3. **Check file paths:**
   - Ensure files exist at specified paths
   - Check case sensitivity (Linux/Mac)

### Issue: "Hydration error" or React errors

**Solutions:**

1. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

2. **Check for server/client mismatches:**
   - Ensure `'use client'` directive in client components
   - Check for browser-only APIs in server components

### Issue: TypeScript compilation errors

**Solutions:**

1. **The project is configured to ignore build errors, but you can check:**
```bash
npm run typecheck
```

2. **Fix common issues:**
   - Add missing type imports
   - Fix type mismatches
   - Add `as` type assertions if needed

## Port and Network Issues

### Issue: "Port 9002 already in use"

**Solutions:**

1. **Find and kill process:**
```bash
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:9002 | xargs kill
```

2. **Change port:**
   - Edit `package.json`:
```json
"dev": "next dev --turbopack -p 9003"
```

3. **Use different port temporarily:**
```bash
npx next dev -p 9003
```

### Issue: "Cannot access localhost:9002"

**Solutions:**

1. **Check if server is running:**
   - Look for "Ready" message in terminal
   - Check for error messages

2. **Try different URL:**
   - `http://127.0.0.1:9002`
   - `http://localhost:9002`

3. **Check firewall:**
   - Allow Node.js through firewall
   - Check antivirus isn't blocking

## Prisma Issues

### Issue: "Prisma Client not generated"

**Solutions:**

1. **Generate Prisma Client:**
```bash
npm run db:generate
```

2. **Check schema file:**
   - Verify `prisma/schema.prisma` exists
   - Check for syntax errors

3. **Reinstall Prisma:**
```bash
npm uninstall @prisma/client prisma
npm install @prisma/client prisma
npm run db:generate
```

### Issue: "Schema validation failed"

**Solutions:**

1. **Push schema to database:**
```bash
npm run db:push
```

2. **Or create migration:**
```bash
npm run db:migrate
```

3. **Check database connection:**
   - Verify `DATABASE_URL` in `.env`
   - Test connection first

### Issue: "Migration failed" or "Schema drift detected"

**Solutions:**

1. **Reset database (WARNING: Deletes data):**
```bash
npx prisma migrate reset
```

2. **Or manually fix schema:**
   - Compare Prisma schema with database
   - Run SQL scripts to fix differences

## Supabase Issues

### Issue: "Row Level Security (RLS) policy violation"

**Solutions:**

1. **Check RLS policies:**
   - Go to Supabase Dashboard → Authentication → Policies
   - Verify policies allow your operations

2. **Temporarily disable RLS (development only):**
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

3. **Use service role key:**
   - Service role key bypasses RLS
   - Only use in server-side code

### Issue: "Storage bucket not found"

**Solutions:**

1. **Create storage bucket:**
   - Go to Supabase Dashboard → Storage
   - Create bucket with public access if needed

2. **Check bucket policies:**
   - Verify upload/download policies
   - Check file size limits

### Issue: "Function not found" or "Edge function error"

**Solutions:**

1. **Check if function exists:**
   - Go to Supabase Dashboard → Edge Functions
   - Verify function is deployed

2. **Check function logs:**
   - View logs in Supabase Dashboard
   - Check for runtime errors

## General Debugging Tips

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

2. **Check server logs:**
   - Look at terminal where `npm run dev` is running
   - Check for error stack traces

3. **Use diagnostic pages:**
   - `/environment-check` - Check environment variables
   - `/database-setup-complete` - Test database connection
   - `/system-diagnostics` - Full system check

4. **Enable verbose logging:**
   - Add `console.log` statements
   - Check Supabase logs in dashboard

5. **Test in isolation:**
   - Test individual API routes
   - Test database queries separately
   - Verify each component works

## Getting Help

If you're still experiencing issues:

1. **Check existing documentation:**
   - [SETUP-GUIDE.md](./SETUP-GUIDE.md)
   - [QUICK-START.md](./QUICK-START.md)
   - Project-specific README files

2. **Collect error information:**
   - Full error message
   - Stack trace
   - Browser console logs
   - Server terminal output
   - Environment details (OS, Node version)

3. **Verify setup:**
   - All prerequisites installed
   - Environment variables set
   - Database configured
   - Dependencies installed

---

**Note:** Most issues can be resolved by:
1. Verifying environment variables
2. Reinstalling dependencies
3. Clearing caches (.next, node_modules)
4. Checking database connection
5. Restarting the development server

