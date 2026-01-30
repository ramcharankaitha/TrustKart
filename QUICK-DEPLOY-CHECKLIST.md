# Quick Deployment Checklist

Follow these steps in order for a successful deployment.

## ✅ Pre-Deployment Checklist

- [ ] **Fix vercel.json** - Already fixed ✓
- [ ] **All code changes committed**
- [ ] **Environment variables documented**
- [ ] **No sensitive data in code** (check .gitignore)

## 🚀 Step-by-Step Deployment

### 1. Commit and Push to Git

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

**Expected Output:** 
```
Enumerating objects: X, done.
Counting objects: 100%, done.
To https://github.com/ramcharankaitha/tk1.git
   main -> main
```

---

### 2. Deploy to Vercel

#### Option A: Via Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import repository: `ramcharankaitha/tk1`
4. Configure:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: **./** (default)
   - Build Command: **npm run build**
   - Output Directory: **.next**
5. Add Environment Variables (see list below)
6. Click **"Deploy"**

#### Option B: Via CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

### 3. Add Environment Variables in Vercel

Go to: **Project Settings → Environment Variables**

Add these variables (select **Production**, **Preview**, and **Development**):

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
NEXTAUTH_SECRET
NEXTAUTH_URL (update after first deploy)
NEXT_PUBLIC_BASE_URL (update after first deploy)
GOOGLE_GENAI_API_KEY (if using chatbot)
NEXT_PUBLIC_MAX_FILE_SIZE
NEXT_PUBLIC_ALLOWED_FILE_TYPES
```

**Important:** 
- After first deploy, update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` with your Vercel URL
- Then redeploy

---

### 4. Verify Deployment

- [ ] Build completed successfully (check Vercel dashboard)
- [ ] Application accessible at `https://your-app.vercel.app`
- [ ] No errors in build logs
- [ ] Test login functionality
- [ ] Test database connections
- [ ] Test API routes

---

## ⚠️ Important Notes

### Windows Build Error (Local Only)
If you see `EISDIR: illegal operation on a directory` error when running `npm run build` locally:
- **This is a Windows-specific issue**
- **Vercel builds on Linux, so this won't affect deployment**
- You can safely ignore this for deployment
- The build will work fine on Vercel

### Environment Variables
- Never commit `.env` files to Git
- Always add environment variables in Vercel dashboard
- Use different values for Production vs Preview if needed

### Database Connection
- Ensure your Supabase database allows connections from Vercel
- Check Supabase dashboard → Settings → Database → Connection Pooling

---

## 🔧 Troubleshooting Quick Fixes

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Check for TypeScript errors (though they're ignored in build)

**Application not loading:**
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Check `NEXTAUTH_URL` matches your domain

**Database connection fails:**
- Verify `DATABASE_URL` is correct
- Check Supabase connection settings
- Ensure connection string uses `pgbouncer=true` for connection pooling

**Git push fails:**
- Use GitHub Personal Access Token for authentication
- Or set up SSH keys

---

## 📝 Post-Deployment

After successful deployment:

1. **Update NEXTAUTH_URL**
   - Get your Vercel URL from dashboard
   - Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` in Vercel
   - Redeploy

2. **Test Everything**
   - Homepage
   - Login/Registration
   - Dashboard
   - API endpoints
   - File uploads (if applicable)

3. **Set Up Custom Domain** (Optional)
   - Add domain in Vercel dashboard
   - Update DNS records
   - Update environment variables

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Application loads at Vercel URL
- ✅ All pages accessible
- ✅ Database connections work
- ✅ Authentication works
- ✅ No runtime errors in logs

---

**Need Help?** Check `DEPLOYMENT-GUIDE.md` for detailed instructions.

