# Quick Start Guide - Backend API

Get the Coding Habit Tracker Backend API running in 5 minutes! 🚀

## Prerequisites

- Node.js v18+
- Supabase account
- Redis (local or cloud)

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd packages/backend-api
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required values:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role secret
- `DATABASE_URL` - Supabase database connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `JWT_SECRET` - A strong random secret for JWT tokens

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# (Optional) Add sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at: `http://localhost:3001`

### 5. Test the API

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 🛠️ Alternative: Automated Setup

Run the setup script for guided installation:

```bash
chmod +x setup.sh
./setup.sh
```

## 📋 Common Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run db:studio       # Open database browser
npm run lint           # Check code quality
```

## 🔧 Troubleshooting

**Database connection failed?**
- Check your `DATABASE_URL` format
- Verify Supabase project is running
- Ensure your IP is allowed in Supabase

**Redis connection error?**
- Install locally: `brew install redis` (macOS)
- Start service: `brew services start redis`
- Or use cloud Redis and update `REDIS_URL`

**Missing Prisma client?**
```bash
npm run db:generate
```

## 🎯 Next Steps

Once running, you can:
1. Register users via `/api/auth/register`
2. Submit coding sessions via `/api/sessions/coding`
3. View API docs in the main README.md

---

Need help? Check the full [README.md](./README.md) for detailed documentation. 