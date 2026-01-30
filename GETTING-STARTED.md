# Getting Started - Step by Step

This guide will walk you through running the TrustKart application step by step.

## Step 1: Navigate to Project Directory

```bash
cd tk-main
```

## Step 2: Install Dependencies

```bash
npm install
```

**Expected output:** Dependencies will be installed. This may take a few minutes.

**If you encounter errors:**
- Make sure Node.js is installed: `node --version` (should be 18+)
- Try: `npm install --legacy-peer-deps`
- On Windows, run PowerShell as Administrator

## Step 3: Create Environment File

**Windows (PowerShell):**
```powershell
Copy-Item env.example .env
```

**Mac/Linux:**
```bash
cp env.example .env
```

## Step 4: Configure Environment Variables

Open `.env` file and update these values:

### Required Changes:

1. **NEXTAUTH_SECRET** - Generate a random secret:
   ```bash
   # Windows (PowerShell)
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # Mac/Linux
   openssl rand -base64 32
   ```
   Or use: https://generate-secret.vercel.app/32

2. **GOOGLE_GENAI_API_KEY** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with Google account
   - Click "Create API Key"
   - Copy and paste into `.env`

### Optional (if using different Supabase project):

If you want to use your own Supabase project instead of the existing one:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select existing
3. Go to **Settings** → **API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings** → **Database**
6. Copy Connection string (Transaction pooler) → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password
   - URL-encode special characters (e.g., `@` becomes `%40`)

## Step 5: Set Up Database

You have two options:

### Option A: Using Prisma (Recommended - Easier)

```bash
npm run db:generate
npm run db:push
```

**What this does:**
- Generates Prisma Client from schema
- Pushes schema to your Supabase database
- Creates all necessary tables

### Option B: Using SQL Scripts (Manual)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **SQL Editor**
3. Run these scripts in order:
   - `SAFE-DATABASE-SETUP.sql` - Creates main tables
   - `FIX-SCHEMA-RELATIONSHIPS.sql` - Sets up relationships
   - `COMPLETE-DELIVERY-AGENT-SETUP.sql` - Delivery features (optional)
   - `CREATE-WALLET-SYSTEM.sql` - Wallet features (optional)

## Step 6: Start the Application

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x.x
- Local:        http://localhost:9002
- Ready in X.XXs
```

## Step 7: Verify Everything Works

1. **Open browser:** http://localhost:9002
   - Should redirect to login page

2. **Check environment:** http://localhost:9002/environment-check
   - Should show all environment variables are set

3. **Test database:** http://localhost:9002/database-setup-complete
   - Click "Test Connection"
   - Should show success message

## Step 8: Create Your First Account

1. Go to: http://localhost:9002/registration
2. Fill in the registration form
3. Select role (CUSTOMER, SHOPKEEPER, ADMIN, etc.)
4. Submit and login

## Common First-Time Issues

### Issue: "Port 9002 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Or change port in package.json
```

### Issue: "Database connection failed"

**Solutions:**
1. Check `.env` file has correct Supabase credentials
2. Verify Supabase project is active (not paused)
3. Test connection at `/database-setup-complete`
4. Check if you need to run database setup scripts

### Issue: "Module not found"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Environment variables not set"

**Solutions:**
1. Verify `.env` file exists in `tk-main` directory
2. Check variable names match exactly (case-sensitive)
3. Restart development server after changing `.env`

## Next Steps After Setup

1. **Create Admin Account:**
   - Register with role `ADMIN`
   - Use admin dashboard to manage system

2. **Set Up Shops:**
   - Create shopkeeper accounts
   - Register shops
   - Add products

3. **Test Order Flow:**
   - Create customer account
   - Browse shops and products
   - Place test orders

4. **Configure Delivery (Optional):**
   - Register delivery agents
   - Test delivery assignment

## Need Help?

- **Detailed Setup:** See [SETUP-GUIDE.md](./SETUP-GUIDE.md)
- **Quick Reference:** See [QUICK-START.md](./QUICK-START.md)
- **Problems?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Verification Checklist

Before considering setup complete, verify:

- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created and configured
- [ ] Database connection works (test at `/database-setup-complete`)
- [ ] Development server starts without errors
- [ ] Can access login page at `http://localhost:9002`
- [ ] Can register a new account
- [ ] Can login with registered account

---

**Congratulations!** 🎉 If all checks pass, your application is ready to use!

