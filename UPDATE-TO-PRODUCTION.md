# Update to Production/Public URL

## Quick Steps to Convert from Localhost to Public URL

### Step 1: Update Environment Variables

Edit your `.env` file in the `tk-main` directory:

**Change from:**
```env
NEXTAUTH_URL="http://localhost:9002"
```

**Change to:**
```env
NEXTAUTH_URL="https://your-actual-domain.com"
NEXT_PUBLIC_BASE_URL="https://your-actual-domain.com"
```

**Examples:**
- If using Vercel: `https://your-app.vercel.app`
- If using custom domain: `https://trustkart.com`
- If using Railway: `https://your-app.railway.app`

### Step 2: Update Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL** to your public URL
4. Add your public URL to **Redirect URLs**:
   - `https://your-domain.com/**`
   - `https://your-domain.com/auth/callback`

### Step 3: Rebuild and Deploy

```bash
npm run build
npm start
```

### Step 4: Verify

1. Visit your public URL
2. Test login/registration
3. Check all features work
4. Verify no console errors

## Environment Variable Reference

```env
# Development
NEXTAUTH_URL="http://localhost:9002"
NEXT_PUBLIC_BASE_URL="http://localhost:9002"

# Production
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

## Important Notes

- **Never commit `.env` file** to version control
- Use platform environment variables for production (Vercel, Railway, etc.)
- Update OAuth redirect URLs if using social login
- Test all features after deployment

