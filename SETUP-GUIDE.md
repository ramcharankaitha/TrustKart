# TrustKart Application Setup Guide

This guide will help you set up and run the TrustKart application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)
- **Supabase Account** (for database) - [Sign up](https://supabase.com/)

## Step 1: Install Dependencies

1. Navigate to the project directory:
```bash
cd tk-main
```

2. Install all dependencies:
```bash
npm install
```

This will install all required packages including Next.js, Prisma, Supabase, and UI components.

## Step 2: Environment Configuration

1. Create a `.env` file in the `tk-main` directory:
```bash
cp env.example .env
```

2. Open `.env` and configure the following variables:

### Required Environment Variables

```env
# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
SUPABASE_ACCESS_TOKEN="your-access-token-here"

# Next.js Configuration
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
NEXTAUTH_URL="http://localhost:9002"

# Optional: File upload configuration
NEXT_PUBLIC_MAX_FILE_SIZE="2097152" # 2MB in bytes
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp,application/pdf"

# Google AI API Key (Required for AI Chatbot)
GOOGLE_GENAI_API_KEY="your-google-ai-api-key-here"
```

### How to Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings** → **Database**
6. Copy the **Connection string** (use the Transaction pooler mode) → `DATABASE_URL`

### How to Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to `GOOGLE_GENAI_API_KEY`

### Generate NextAuth Secret

You can generate a random secret using:
```bash
openssl rand -base64 32
```

Or use an online generator: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

## Step 3: Database Setup

### Option A: Using Prisma (Recommended)

1. Generate Prisma Client:
```bash
npm run db:generate
```

2. Push the schema to your database:
```bash
npm run db:push
```

3. (Optional) Seed the database with initial data:
```bash
npm run db:seed
```

### Option B: Using SQL Scripts

If you prefer to set up the database manually:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL scripts in order:
   - `SAFE-DATABASE-SETUP.sql` (or `SAFE-APPLICATION-SETUP.sql`)
   - `CREATE-ORGANIC-VEGETABLES-TABLE.sql` (if needed)
   - `COMPLETE-DELIVERY-AGENT-SETUP.sql` (if using delivery features)
   - `CREATE-WALLET-SYSTEM.sql` (if using wallet features)

**Important:** Make sure to run `FIX-SCHEMA-RELATIONSHIPS.sql` after creating tables to ensure proper foreign key relationships.

## Step 4: Run the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at: **http://localhost:9002**

### Production Build

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Step 5: Verify Installation

1. Open your browser and navigate to `http://localhost:9002`
2. You should be redirected to the login page
3. Test the database connection by visiting: `http://localhost:9002/database-setup-complete`
4. Click "Test Connection" to verify database connectivity

## Common Issues and Solutions

### Issue 1: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Database connection errors

**Solution:**
1. Verify your `.env` file has correct credentials
2. Check that your Supabase project is active
3. Ensure the database connection string uses the correct port (6543 for connection pooling)
4. Test connection at: `http://localhost:9002/database-setup-complete`

### Issue 3: Prisma Client not generated

**Solution:**
```bash
npm run db:generate
```

### Issue 4: "Schema validation failed" errors

**Solution:**
1. Run Prisma push to sync schema:
```bash
npm run db:push
```

2. Or manually run the SQL setup scripts in Supabase

### Issue 5: Port 9002 already in use

**Solution:**
Change the port in `package.json`:
```json
"dev": "next dev --turbopack -p 9003"
```

Or kill the process using port 9002:
```bash
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:9002 | xargs kill
```

### Issue 6: Missing environment variables

**Solution:**
1. Ensure `.env` file exists in `tk-main` directory
2. Check that all required variables are set
3. Restart the development server after changing `.env`

### Issue 7: TypeScript errors

**Solution:**
The project is configured to ignore build errors, but you can check types:
```bash
npm run typecheck
```

## Project Structure

```
tk-main/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and database clients
│   ├── context/          # React context providers
│   └── hooks/            # Custom React hooks
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed script
├── public/               # Static assets
└── .env                  # Environment variables (create this)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## Next Steps

1. **Create an Admin Account**: Visit `/registration` and create an account with role `ADMIN`
2. **Set up Shops**: Use the shop registration flow to create shops
3. **Add Products**: Shopkeepers can add products through their dashboard
4. **Test Orders**: Create test orders to verify the order flow
5. **Configure Delivery**: Set up delivery agents if using delivery features

## Support Pages

The application includes several diagnostic pages:

- `/database-setup-complete` - Database setup and testing
- `/system-diagnostics` - System health check
- `/environment-check` - Environment variables verification
- `/database-test` - Database connection test

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](./README.md)

## Troubleshooting

If you encounter issues not covered here:

1. Check the browser console for errors
2. Check the terminal/command prompt for server errors
3. Verify all environment variables are set correctly
4. Ensure database tables are created properly
5. Check Supabase project status and logs

For database-related issues, visit `/database-setup-complete` and use the diagnostic tools.

---

**Note:** This application uses Supabase for the database. Make sure your Supabase project is active and properly configured before running the application.

