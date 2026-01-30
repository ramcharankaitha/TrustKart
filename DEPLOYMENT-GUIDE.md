# Complete Deployment Guide: Vercel + Git

This guide will walk you through deploying your TrustKart application to Vercel and pushing to Git with zero errors.

## Prerequisites

- ✅ Node.js installed (v18 or higher)
- ✅ Git installed and configured
- ✅ Vercel account (free tier works)
- ✅ GitHub account
- ✅ All environment variables ready

---

## Step 1: Prepare Your Environment Variables

### 1.1 Create `.env.local` file (for local testing)
```bash
# Copy from env.example
cp env.example .env.local
```

### 1.2 Required Environment Variables for Vercel

You'll need to add these in Vercel dashboard. Get them ready:

**Database:**
- `DATABASE_URL` - Your Supabase PostgreSQL connection string

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token

**Next.js:**
- `NEXTAUTH_SECRET` - Generate a random secret (use: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Will be your Vercel URL (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_BASE_URL` - Same as NEXTAUTH_URL

**AI Chatbot (Optional):**
- `GOOGLE_GENAI_API_KEY` - Your Google AI API key
- `N8N_AGENT_WEBHOOK_URL` - (Optional) n8n webhook URL
- `N8N_AGENT_WEBHOOK_SECRET` - (Optional) n8n webhook secret

**File Upload:**
- `NEXT_PUBLIC_MAX_FILE_SIZE` - Default: `2097152` (2MB)
- `NEXT_PUBLIC_ALLOWED_FILE_TYPES` - Default: `image/jpeg,image/png,image/webp,application/pdf`

---

## Step 2: Fix Git Repository

### 2.1 Check Git Status
```bash
git status
```

### 2.2 Add All Changes
```bash
# Add all modified and new files
git add .

# Or add specific files
git add vercel.json
git add src/
git add package.json
# ... etc
```

### 2.3 Commit Changes
```bash
git commit -m "Prepare for Vercel deployment: Fix vercel.json and update configuration"
```

### 2.4 Verify Remote Repository
```bash
git remote -v
# Should show: origin https://github.com/ramcharankaitha/tk1.git
```

If remote is not set:
```bash
git remote add origin https://github.com/ramcharankaitha/tk1.git
```

---

## Step 3: Push to Git

### 3.1 Push to Main Branch
```bash
# Make sure you're on main branch
git checkout main

# Push to remote
git push origin main
```

If you encounter authentication issues:
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys

### 3.2 Verify Push
```bash
git log --oneline -5
# Should show your latest commit
```

---

## Step 4: Deploy to Vercel

### 4.1 Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
```

### 4.2 Login to Vercel
```bash
vercel login
```

### 4.3 Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `ramcharankaitha/tk1`
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables**
   - Click "Environment Variables" section
   - Add each variable from Step 1.2:
     ```
     DATABASE_URL = your-database-url
     NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
     SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
     SUPABASE_ACCESS_TOKEN = your-access-token
     NEXTAUTH_SECRET = your-generated-secret
     NEXTAUTH_URL = https://your-app.vercel.app (will be auto-filled after first deploy)
     NEXT_PUBLIC_BASE_URL = https://your-app.vercel.app (same as above)
     GOOGLE_GENAI_API_KEY = your-google-ai-key (if using chatbot)
     ```
   - **Important:** Select all environments (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)

### 4.4 Deploy via CLI (Alternative)

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No (first time) or Yes (if redeploying)
# - Project name? (Press Enter for default)
# - Directory? (Press Enter for ./)
# - Override settings? No

# After first deploy, for production:
vercel --prod
```

---

## Step 5: Update Environment Variables After First Deploy

### 5.1 Get Your Vercel URL
After first deployment, Vercel will provide a URL like:
- `https://your-app-name.vercel.app`

### 5.2 Update NEXTAUTH_URL and NEXT_PUBLIC_BASE_URL
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update:
   - `NEXTAUTH_URL` = `https://your-app-name.vercel.app`
   - `NEXT_PUBLIC_BASE_URL` = `https://your-app-name.vercel.app`
3. Redeploy (or wait for automatic redeploy on next push)

---

## Step 6: Verify Deployment

### 6.1 Check Build Logs
- Go to Vercel Dashboard → Your Project → Deployments
- Click on latest deployment
- Check "Build Logs" for any errors

### 6.2 Test Your Application
1. Visit your Vercel URL
2. Test key features:
   - ✅ Homepage loads
   - ✅ Login works
   - ✅ Database connections work
   - ✅ API routes respond
   - ✅ File uploads work (if applicable)

### 6.3 Check Function Logs
- Vercel Dashboard → Your Project → Functions
- Monitor for any runtime errors

---

## Step 7: Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your custom domain

---

## Step 8: Continuous Deployment Setup

Vercel automatically deploys on every push to your main branch.

### 8.1 Automatic Deployments
- **Production:** Deploys from `main` branch
- **Preview:** Deploys from other branches and pull requests

### 8.2 Manual Deployment
```bash
# Push to Git
git push origin main

# Vercel will automatically detect and deploy
```

---

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Make sure all dependencies are in package.json
npm install
npm run build
```

**Error: Environment variable missing**
- Check Vercel Dashboard → Environment Variables
- Ensure all required variables are set for Production environment

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check Supabase connection settings
- Ensure database allows connections from Vercel IPs

### Runtime Errors

**Error: API route not found**
- Check file structure matches Next.js App Router conventions
- Verify route files are in `src/app/api/` directory

**Error: Authentication not working**
- Verify `NEXTAUTH_URL` matches your Vercel domain exactly
- Check `NEXTAUTH_SECRET` is set

### Git Push Errors

**Error: Authentication failed**
```bash
# Use Personal Access Token instead of password
# Or set up SSH:
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add public key to GitHub
```

**Error: Branch is behind**
```bash
git pull origin main
# Resolve conflicts if any
git push origin main
```

---

## Quick Command Reference

```bash
# Git Commands
git status                          # Check changes
git add .                           # Stage all changes
git commit -m "Your message"        # Commit changes
git push origin main                # Push to GitHub

# Build Commands
npm install                         # Install dependencies
npm run build                       # Build for production
npm run dev                         # Run development server

# Vercel Commands
vercel login                        # Login to Vercel
vercel                              # Deploy to preview
vercel --prod                       # Deploy to production
vercel env pull .env.local          # Pull env vars locally
```

---

## Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Build completed successfully
- [ ] Application accessible at Vercel URL
- [ ] Database connections working
- [ ] Authentication working
- [ ] API routes responding
- [ ] File uploads working (if applicable)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/logging set up
- [ ] Error tracking configured (optional)

---

## Next Steps

1. **Monitor Performance**
   - Use Vercel Analytics (if enabled)
   - Monitor function execution times
   - Check error rates

2. **Set Up Monitoring**
   - Consider adding error tracking (Sentry, etc.)
   - Set up uptime monitoring
   - Configure alerts

3. **Optimize**
   - Enable Vercel Edge Functions if needed
   - Optimize images
   - Enable caching where appropriate

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check Vercel function logs
3. Review this guide's troubleshooting section
4. Check Next.js and Vercel documentation
5. Review your environment variables

---

**Last Updated:** January 2025
**Project:** TrustKart (tk-main)

