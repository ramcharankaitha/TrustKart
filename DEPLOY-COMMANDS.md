# Exact Commands to Deploy - Copy & Paste Ready

Copy and paste these commands in order. Make sure you're in the project root directory.

## Step 1: Verify You're in the Right Directory

```powershell
# Windows PowerShell
cd E:\TRUSTKART\tk-main
pwd
# Should show: E:\TRUSTKART\tk-main
```

---

## Step 2: Check Git Status

```powershell
git status
```

**What to expect:**
- Lists modified and untracked files
- Shows current branch (should be `main`)

---

## Step 3: Add All Changes to Git

```powershell
git add .
```

**What to expect:**
- No output (success)
- Files are now staged

---

## Step 4: Commit Changes

```powershell
git commit -m "Prepare for Vercel deployment: Update vercel.json and configuration"
```

**What to expect:**
```
[main abc1234] Prepare for Vercel deployment: Update vercel.json and configuration
 X files changed, Y insertions(+), Z deletions(-)
```

---

## Step 5: Verify Remote Repository

```powershell
git remote -v
```

**What to expect:**
```
origin  https://github.com/ramcharankaitha/tk1.git (fetch)
origin  https://github.com/ramcharankaitha/tk1.git (push)
```

If you see "fatal: No remote configured", add it:
```powershell
git remote add origin https://github.com/ramcharankaitha/tk1.git
```

---

## Step 6: Push to GitHub

```powershell
git push origin main
```

**What to expect:**
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to X threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), Y KiB | Z MiB/s, done.
To https://github.com/ramcharankaitha/tk1.git
   abc1234..def5678  main -> main
```

**If you get authentication error:**
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys

---

## Step 7: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Open browser: https://vercel.com/dashboard
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find and select: `ramcharankaitha/tk1`
5. Click **"Import"**
6. Configure:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: **./** (leave default)
   - Build Command: **npm run build** (auto-detected)
   - Output Directory: **.next** (auto-detected)
7. Click **"Environment Variables"**
8. Add all variables (see list below)
9. Click **"Deploy"**
10. Wait 2-5 minutes for build

### Option B: Via Vercel CLI

```powershell
# Install Vercel CLI (first time only)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**Follow prompts:**
- Set up and deploy? → **Yes**
- Which scope? → **Select your account**
- Link to existing project? → **No** (first time) or **Yes** (if redeploying)
- Project name? → **Press Enter** (use default)
- Directory? → **Press Enter** (use ./)
- Override settings? → **No**

---

## Step 8: Add Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add each variable (copy from your `env.example` or `.env.local`):

### Required Variables:

```
DATABASE_URL
= postgresql://postgres:Ramcharan%407@db.ilzjrfbrqcmilmgauiva.supabase.co:6543/postgres?pgbouncer=true

NEXT_PUBLIC_SUPABASE_URL
= https://ilzjrfbrqcmilmgauiva.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsempyZmJycWNtaWxtZ2F1aXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTU3NDgsImV4cCI6MjA3NjM5MTc0OH0.Jig8eqna_J2uUb6TFk0Lh4ADJyMGvRsswM-zMnKJXFQ

SUPABASE_SERVICE_ROLE_KEY
= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsempyZmJycWNtaWxtZ2F1aXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgxNTc0OCwiZXhwIjoyMDc2MzkxNzQ4fQ.0FU5DDgjendzALzf1QMM-ozrbpj0Y5BjbWDZZPQKlOU

SUPABASE_ACCESS_TOKEN
= sbp_d44242d6cc2bfc77962ba2b1e593e2778cfdc147

NEXTAUTH_SECRET
= your-secret-key-here
(Generate a new one: openssl rand -base64 32)

NEXTAUTH_URL
= https://your-app-name.vercel.app
(Update this AFTER first deploy with your actual Vercel URL)

NEXT_PUBLIC_BASE_URL
= https://your-app-name.vercel.app
(Same as NEXTAUTH_URL, update after first deploy)

GOOGLE_GENAI_API_KEY
= your-google-ai-api-key-here
(If using chatbot)

NEXT_PUBLIC_MAX_FILE_SIZE
= 2097152

NEXT_PUBLIC_ALLOWED_FILE_TYPES
= image/jpeg,image/png,image/webp,application/pdf
```

**Important:**
- Select **Production**, **Preview**, and **Development** for each variable
- After first deploy, update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` with your actual Vercel URL
- Then redeploy

---

## Step 9: Verify Deployment

### Check Build Status
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Check "Build Logs" - should show "Build Completed"

### Test Your Application
1. Visit your Vercel URL (shown in dashboard)
2. Test:
   - ✅ Homepage loads
   - ✅ Login page works
   - ✅ Can register/login
   - ✅ Dashboard loads
   - ✅ No console errors

---

## Step 10: Update URLs After First Deploy

After first deployment, Vercel gives you a URL like: `https://your-app-name.vercel.app`

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Update:
   - `NEXTAUTH_URL` = `https://your-app-name.vercel.app`
   - `NEXT_PUBLIC_BASE_URL` = `https://your-app-name.vercel.app`
3. Go to **Deployments** tab
4. Click **"Redeploy"** on latest deployment
5. Or push a new commit to trigger redeploy

---

## Troubleshooting Commands

### If Git Push Fails:

```powershell
# Pull latest changes first
git pull origin main

# If there are conflicts, resolve them, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### If Build Fails on Vercel:

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables → Add them
   - TypeScript errors → Check code (though errors are ignored)
   - Missing dependencies → Check package.json

### If Application Doesn't Load:

1. Check function logs in Vercel dashboard
2. Verify environment variables are set
3. Check `NEXTAUTH_URL` matches your domain exactly

---

## Quick Reference

```powershell
# Git Commands
git status                    # Check changes
git add .                     # Stage all
git commit -m "message"       # Commit
git push origin main          # Push to GitHub

# Vercel Commands
vercel login                  # Login
vercel                        # Deploy preview
vercel --prod                 # Deploy production
vercel env pull .env.local    # Pull env vars locally

# Build Commands
npm install                   # Install deps
npm run build                 # Build (may fail on Windows, but works on Vercel)
npm run dev                   # Dev server
```

---

## Success Checklist

- [ ] Code pushed to GitHub successfully
- [ ] Vercel project created and linked
- [ ] All environment variables added
- [ ] Build completed successfully
- [ ] Application accessible at Vercel URL
- [ ] Login/authentication works
- [ ] Database connections work
- [ ] No errors in Vercel logs

---

**That's it! Your app should now be live on Vercel! 🚀**

