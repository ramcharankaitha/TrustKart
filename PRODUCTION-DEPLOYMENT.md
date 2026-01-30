# Production Deployment Guide

This guide explains how to deploy TrustKart to a public URL (production).

## Environment Variables for Production

Update your `.env` file with production values:

```env
# Database Configuration (Keep your Supabase connection)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true"

# Supabase Configuration (Keep your Supabase credentials)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ACCESS_TOKEN="your-access-token"

# Next.js Configuration - IMPORTANT: Change to your public URL
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"
# Use your actual domain name here, e.g.:
# NEXTAUTH_URL="https://trustkart.com"
# NEXTAUTH_URL="https://app.trustkart.com"

# Optional: File upload configuration
NEXT_PUBLIC_MAX_FILE_SIZE="2097152"
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp,application/pdf"

# Google AI API Key
GOOGLE_GENAI_API_KEY="your-google-ai-api-key-here"
```

## Key Changes for Production

### 1. Update NEXTAUTH_URL

**Before (Development):**
```env
NEXTAUTH_URL="http://localhost:9002"
```

**After (Production):**
```env
NEXTAUTH_URL="https://your-domain.com"
```

### 2. Update Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **URL Configuration**
3. Add your production URL to:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: 
     - `https://your-domain.com/**`
     - `https://your-domain.com/auth/callback`

### 3. Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deployment Platforms

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

**Vercel automatically provides:**
- Public URL (e.g., `https://your-app.vercel.app`)
- HTTPS certificate
- CDN
- Automatic deployments

### Other Platforms

- **Netlify**: Similar to Vercel
- **Railway**: Good for full-stack apps
- **Render**: Simple deployment
- **AWS/GCP/Azure**: Enterprise solutions

## Important Notes

1. **Never commit `.env` file** - Use platform's environment variable settings
2. **Update CORS settings** in Supabase if needed
3. **Update OAuth redirect URLs** for any social logins
4. **Test all features** after deployment
5. **Monitor logs** for any errors

## Verification Checklist

After deployment:
- [ ] Application loads at public URL
- [ ] Login/Registration works
- [ ] Database connections work
- [ ] File uploads work (if using Supabase Storage)
- [ ] All API routes accessible
- [ ] No console errors
- [ ] HTTPS is enabled

---

**Note:** Keep your local `.env` for development and use platform-specific environment variables for production.

