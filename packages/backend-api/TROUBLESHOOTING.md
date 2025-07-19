# Troubleshooting Guide - Backend API

Common issues and their solutions when setting up the Coding Habit Tracker Backend API.

## 🔧 Prisma Client Errors

### Error: "Cannot read properties of undefined (reading 'bind')"

**Symptoms:**
```
TypeError: Cannot read properties of undefined (reading 'bind')
    at Gr.wrapEngine (...LibraryEngine.ts:141:27)
```

**Cause:** Prisma client not properly generated or database connection issues.

**Solutions:**

#### Step 1: Check Environment Variables
```bash
# Make sure you have a .env file
ls -la .env

# Check if DATABASE_URL is set
cat .env | grep DATABASE_URL
```

#### Step 2: Regenerate Prisma Client
```bash
# Delete existing client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall and regenerate
npm install
npm run db:generate
```

#### Step 3: Verify Database Connection
```bash
# Test connection with Prisma
npx prisma db push --preview-feature
```

#### Step 4: Check Prisma Versions
```bash
# Ensure versions match
npm list @prisma/client prisma
```

#### Step 5: Manual Fix (if above doesn't work)
```bash
# Force reinstall Prisma
npm uninstall @prisma/client prisma
npm install @prisma/client@latest prisma@latest
npm run db:generate
```

---

## 🗄️ Database Connection Issues

### Error: "Can't reach database server"

**Solutions:**

1. **Check DATABASE_URL format:**
   ```env
   # Correct format for Supabase:
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"
   ```

2. **Verify Supabase credentials:**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Check IP allowlist:**
   - In Supabase Dashboard → Settings → Authentication
   - Make sure your IP is allowed or use `0.0.0.0/0` for development

---

## 🔴 Redis Connection Issues

### Error: "Redis Client Error: connect ECONNREFUSED"

**Solutions:**

#### Option 1: Install Local Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian  
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

#### Option 2: Use Cloud Redis (Recommended)
1. Sign up for [Upstash](https://upstash.com) (free tier)
2. Create a Redis database
3. Update your `.env`:
   ```env
   REDIS_URL=redis://...your-upstash-url...
   REDIS_PASSWORD=your-upstash-password
   ```

#### Option 3: Temporarily Disable Redis
```bash
# Comment out Redis in your .env
# REDIS_URL=redis://localhost:6379
```

---

## ⚠️ Environment Variable Issues

### Missing or Invalid Environment Variables

**Check required variables:**
```bash
# Create .env from template if missing
cp env.example .env

# Verify all required variables are set
cat .env
```

**Required variables:**
- `DATABASE_URL` - Supabase database connection
- `DIRECT_URL` - Direct database connection  
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Random secure string

**Generate JWT_SECRET:**
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚨 Common Setup Mistakes

### 1. Wrong Directory
Make sure you're in the correct directory:
```bash
pwd
# Should show: /path/to/your/project/packages/backend-api
```

### 2. Node.js Version
Check Node.js version:
```bash
node --version
# Should be v18 or higher
```

### 3. Missing Dependencies
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. Port Already in Use
If port 3001 is busy:
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 PID_NUMBER

# Or use a different port in .env
PORT=3002
```

---

## 🔄 Complete Reset (Nuclear Option)

If nothing else works, try a complete reset:

```bash
# 1. Clean everything
rm -rf node_modules
rm -rf .env
rm package-lock.json

# 2. Fresh start
npm install
cp env.example .env

# 3. Edit .env with your actual values
nano .env

# 4. Regenerate Prisma
npm run db:generate
npm run db:push

# 5. Start server
npm run dev
```

---

## 🆘 Still Having Issues?

1. **Check the logs carefully** - the error message usually tells you what's wrong
2. **Verify your Supabase project** is running and accessible
3. **Test database connection** with a simple query
4. **Make sure all environment variables** are correctly set
5. **Try the automated setup script**: `./setup.sh`

### Get Help
- Check our main [README.md](./README.md) for detailed setup instructions
- Review the [QUICKSTART.md](./QUICKSTART.md) for essential steps only
- Ensure your Supabase project is properly configured 