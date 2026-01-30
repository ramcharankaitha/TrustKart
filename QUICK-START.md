# Quick Start Guide

Follow these steps to get the application running quickly:

## 1. Install Dependencies

```bash
cd tk-main
npm install
```

## 2. Set Up Environment Variables

**Windows (PowerShell):**
```powershell
Copy-Item env.example .env
```

**Mac/Linux:**
```bash
cp env.example .env
```

**Important:** Edit `.env` and update the following:
- `NEXTAUTH_SECRET` - Generate a random secret (use: `openssl rand -base64 32`)
- `GOOGLE_GENAI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 3. Set Up Database

### Option A: Using Prisma (Quick)
```bash
npm run db:generate
npm run db:push
```

### Option B: Using Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Open SQL Editor
3. Run: `SAFE-DATABASE-SETUP.sql`
4. Then run: `FIX-SCHEMA-RELATIONSHIPS.sql`

## 4. Start the Application

```bash
npm run dev
```

Visit: **http://localhost:9002**

## 5. Verify Setup

1. Visit: `http://localhost:9002/environment-check` - Check environment variables
2. Visit: `http://localhost:9002/database-setup-complete` - Test database connection
3. Visit: `http://localhost:9002/login` - Test login page

## Troubleshooting

### Port Already in Use
Change port in `package.json`:
```json
"dev": "next dev --turbopack -p 9003"
```

### Database Connection Failed
1. Check `.env` file has correct Supabase credentials
2. Verify Supabase project is active
3. Test connection at `/database-setup-complete`

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Create an admin account at `/registration`
- Set up shops and products
- Test the order flow

For detailed setup, see [SETUP-GUIDE.md](./SETUP-GUIDE.md)

