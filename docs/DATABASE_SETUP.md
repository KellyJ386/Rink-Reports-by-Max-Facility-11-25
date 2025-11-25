# Database Setup Guide

This guide will walk you through setting up the database for the MFO Platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Option 1: Local PostgreSQL](#option-1-local-postgresql-recommended-for-development)
- [Option 2: Vercel Postgres](#option-2-vercel-postgres)
- [Option 3: Supabase](#option-3-supabase-recommended-for-production)
- [Option 4: Railway](#option-4-railway)
- [Running Migrations](#running-migrations)
- [Seeding the Database](#seeding-the-database)
- [Verifying Setup](#verifying-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git

---

## Option 1: Local PostgreSQL (Recommended for Development)

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run the installer and follow the wizard
- Note the password you set for the `postgres` user

### Create Database

**macOS/Linux:**
```bash
# Create database
createdb mfo_dev

# Or if you need to specify user
psql -U postgres -c "CREATE DATABASE mfo_dev;"
```

**Windows:**
```bash
# Open Command Prompt or PowerShell
psql -U postgres
CREATE DATABASE mfo_dev;
\q
```

### Update .env

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mfo_dev?schema=public"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

## Option 2: Vercel Postgres

### Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" in the sidebar
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name and region
6. Click "Create"

### Get Connection String

1. In your new database, go to the "Settings" tab
2. Find the "Connection String" section
3. Copy the `POSTGRES_URL` (not the pooled URL)

### Update .env

```env
DATABASE_URL="postgres://default:abc123@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

**Important:** Use the non-pooled URL for migrations. Use the pooled URL (`POSTGRES_URL_NON_POOLING`) for the app.

---

## Option 3: Supabase (Recommended for Production)

### Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Fill in:
   - **Name**: `mfo-platform`
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### Get Connection String

1. In your project dashboard, click "Settings" (gear icon)
2. Click "Database" in the left sidebar
3. Scroll to "Connection string"
4. Select "Connection pooling" tab
5. Copy the "Connection string" (with `Transaction` mode)
6. Replace `[YOUR-PASSWORD]` with your database password

### Update .env

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
```

---

## Option 4: Railway

### Setup

1. Go to [Railway](https://railway.app/)
2. Sign in with GitHub
3. Click "New Project"
4. Click "Provision PostgreSQL"
5. Wait for database to be created

### Get Connection String

1. Click on your PostgreSQL service
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` value

### Update .env

```env
DATABASE_URL="postgresql://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway"
```

---

## Running Migrations

Once your database is set up and `.env` is configured:

### 1. Generate Prisma Client
```bash
npm run prisma:generate
```

This generates the TypeScript types for your database schema.

### 2. Run Migrations
```bash
npm run prisma:migrate
# Or for development:
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Set up relationships
- Apply indexes

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "mfo_dev", schema "public" at "localhost:5432"

Applying migration `20231125000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20231125000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

---

## Seeding the Database

After migrations are complete, seed the database with initial data:

```bash
npm run prisma:seed
# Or:
npx prisma db seed
```

This creates:
- **4 Default Roles**: General Manager, Facility Manager, Supervisor, Operator
- **1 Sample Facility**: Demo Ice Arena (Minneapolis)
- **2 Rinks**: Main Rink, Studio Rink
- **4 Test Users**:
  - `gm@demo.com` (General Manager)
  - `manager@demo.com` (Facility Manager)
  - `supervisor@demo.com` (Supervisor)
  - `operator@demo.com` (Operator)
  - All passwords: `password123`
- **1 Form Template**: Ice Make Report

**Expected output:**
```
🌱 Starting database seed...
Creating default roles...
Creating demo facility...
Creating demo rinks...
Creating demo users...
Creating form templates...
✅ Database seeded successfully!

🔑 Demo accounts created:
  General Manager: gm@demo.com / password123
  Facility Manager: manager@demo.com / password123
  Supervisor: supervisor@demo.com / password123
  Operator: operator@demo.com / password123

📋 Form templates created:
  - Ice Make Report (Ice Operations)

🚀 Next steps:
  1. Run: npm run dev
  2. Visit: http://localhost:3000/login
  3. Try logging in with any demo account
  4. Navigate to Ice Operations and submit a form
  5. View data in Prisma Studio: npx prisma studio
```

---

## Verifying Setup

### Check Database Tables

**Option 1: Using Prisma Studio (Recommended)**
```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View data
- Edit records (be careful!)

**Option 2: Using psql**
```bash
psql -d mfo_dev

# List all tables
\dt

# View users
SELECT email, "firstName", "lastName" FROM users;

# View roles
SELECT name, "isSystemDefault" FROM roles;

# Exit
\q
```

### Test Login

1. Start the development server:
```bash
npm run dev
```

2. Visit http://localhost:3000/login

3. Log in with:
   - Email: `gm@demo.com`
   - Password: `password123`

4. You should be redirected to the dashboard

---

## Troubleshooting

### Error: "Can't reach database server"

**Problem**: Next.js can't connect to PostgreSQL.

**Solutions**:
1. **Check PostgreSQL is running**:
   ```bash
   # macOS/Linux
   pg_isready

   # Should return:
   # /tmp:5432 - accepting connections
   ```

2. **Check DATABASE_URL format**:
   ```env
   # Correct format:
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

   # Common mistakes:
   # - Missing password
   # - Wrong port (default is 5432)
   # - Wrong database name
   ```

3. **Restart PostgreSQL**:
   ```bash
   # macOS
   brew services restart postgresql@15

   # Ubuntu/Debian
   sudo service postgresql restart
   ```

### Error: "P1001: Can't reach database server"

**Problem**: Database host is not accessible.

**Solutions**:
1. For cloud databases (Vercel/Supabase), check:
   - Your internet connection
   - The database URL is correct
   - The database isn't paused (free tier sometimes pauses)

2. Firewall/VPN:
   - Disable VPN temporarily
   - Check firewall isn't blocking port 5432

### Error: "Error: P3018 Schema does not exist"

**Problem**: Migration hasn't been run yet.

**Solution**:
```bash
npx prisma migrate dev --name init
```

### Error: "Authentication failed"

**Problem**: Wrong username or password in DATABASE_URL.

**Solutions**:
1. Check `.env` file has correct credentials
2. For local PostgreSQL:
   ```bash
   # Reset postgres password (macOS/Linux)
   psql -U postgres
   ALTER USER postgres PASSWORD 'newpassword';
   \q
   ```

### Error: "Module not found: Can't resolve '@prisma/client'"

**Problem**: Prisma Client not generated.

**Solution**:
```bash
npm run prisma:generate
```

### Error: "Database 'mfo_dev' does not exist"

**Problem**: Database hasn't been created.

**Solution**:
```bash
# Create it
createdb mfo_dev

# Or using psql
psql -U postgres -c "CREATE DATABASE mfo_dev;"
```

### Seed Script Fails

**Problem**: Seed data already exists or conflict.

**Solutions**:
1. **Reset database** (WARNING: Deletes all data):
   ```bash
   npx prisma migrate reset
   ```
   This will:
   - Drop the database
   - Create it again
   - Run all migrations
   - Run seed script

2. **Or manually clear tables**:
   ```bash
   npx prisma studio
   # Delete all records from each table
   ```

---

## Environment Variables Checklist

Ensure your `.env` has these variables:

### Required for Basic Operation
- [x] `DATABASE_URL` - PostgreSQL connection string
- [x] `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)

### Optional (Can add later)
- [ ] `OPENWEATHER_API_KEY` - For outside temperature
- [ ] `RESEND_API_KEY` - For email notifications
- [ ] `TWILIO_ACCOUNT_SID` - For SMS notifications
- [ ] `TWILIO_AUTH_TOKEN` - For SMS notifications
- [ ] `CLOUDINARY_CLOUD_NAME` - For photo uploads (Phase 3)

---

## Database Maintenance

### Backup Database

**Local PostgreSQL:**
```bash
pg_dump mfo_dev > backup_$(date +%Y%m%d).sql
```

**Restore from backup:**
```bash
psql mfo_dev < backup_20231125.sql
```

**Supabase/Vercel:**
Use their dashboard backup features (usually automatic).

### Reset Database

**WARNING: This deletes ALL data!**

```bash
npx prisma migrate reset
```

Use this when:
- You want to start fresh
- Schema changes aren't applying correctly
- Testing seed scripts

### View Migration History

```bash
npx prisma migrate status
```

Shows which migrations have been applied.

---

## Next Steps

Once your database is set up and seeded:

1. ✅ **Test the application**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

2. ✅ **Submit a test form**:
   - Log in as any user
   - Go to Ice Operations
   - Fill out Ice Make form
   - Submit

3. ✅ **Verify submission**:
   ```bash
   npx prisma studio
   ```
   Check the `submissions` table

4. ✅ **Continue with Phase 2**:
   See `ROADMAP.md` for next development steps

---

## Quick Reference

### Common Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name my_migration_name
```

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `gm@demo.com` | `password123` | General Manager (Full access) |
| `manager@demo.com` | `password123` | Facility Manager |
| `supervisor@demo.com` | `password123` | Supervisor |
| `operator@demo.com` | `password123` | Operator |

---

## Getting Help

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Project Issues**: Check `ROADMAP.md` and `QUICK_START.md`

---

**Your database is now ready! 🎉**

Continue to `QUICK_START.md` for development next steps.
