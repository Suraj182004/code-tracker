# Backend API - Coding Habit Tracker

A comprehensive Node.js backend API for the Coding Habit Tracker application, built with Express.js, Prisma ORM, Supabase, and Redis.

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Cache**: Redis (for rate limiting and leaderboards)
- **Authentication**: Supabase Auth with JWT
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Supabase Account** ([supabase.com](https://supabase.com))
- **Redis** (local installation or cloud service like Redis Cloud)

## 🛠️ Installation

### 1. Clone and Navigate to Backend

```bash
# From project root
cd packages/backend-api
```

### 2. Install Dependencies

```bash
npm install
```

## ⚙️ Configuration

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

```env
# Database Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Prisma Database URLs
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# API Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
API_VERSION=v1

# CORS Configuration
FRONTEND_URL=http://localhost:5173
CHROME_EXTENSION_ID=your_chrome_extension_id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Get Database Connection String

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** and replace `[YOUR-PASSWORD]` with your database password
4. Use the format shown in the `.env` example above

## 🗄️ Database Setup

### 1. Generate Prisma Client

```bash
npm run db:generate
```

### 2. Push Database Schema

This will create all tables, indexes, and constraints in your Supabase database:

```bash
npm run db:push
```

### 3. (Optional) Seed Database

Add sample data for testing:

```bash
npm run db:seed
```

### 4. (Optional) View Database

Open Prisma Studio to visually explore your database:

```bash
npm run db:studio
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The API will be available at: `http://localhost:3001`

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Health Check

Verify the API is running:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `POST` | `/api/auth/refresh` | Refresh JWT token | ❌ |
| `GET` | `/api/auth/profile` | Get user profile | ✅ |
| `PUT` | `/api/auth/profile` | Update user profile | ✅ |
| `POST` | `/api/auth/logout` | User logout | ✅ |

### Session Data Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/sessions/coding` | Submit coding session | ✅ |
| `POST` | `/api/sessions/website` | Submit website session | ✅ |
| `POST` | `/api/sessions/batch` | Batch submit sessions | ✅ |
| `GET` | `/api/sessions/recent` | Get recent sessions | ✅ |

### System Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api` | API information |

## 🔐 Authentication

### Registration Example

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "username": "developer123",
    "displayName": "John Developer"
  }'
```

### Login Example

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### Using JWT Token

Include the JWT token in the Authorization header:

```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer your_jwt_token_here"
```

## 📊 Submit Session Data

### Coding Session Example

```bash
curl -X POST http://localhost:3001/api/sessions/coding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sessionStart": "2024-01-01T10:00:00Z",
    "sessionEnd": "2024-01-01T11:30:00Z",
    "projectName": "My Awesome Project",
    "language": "typescript",
    "framework": "react",
    "linesAdded": 150,
    "linesDeleted": 25,
    "keystrokes": 2400,
    "productivityScore": 85.5
  }'
```

### Website Session Example

```bash
curl -X POST http://localhost:3001/api/sessions/website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "domain": "github.com",
    "urlCategory": "coding",
    "sessionStart": "2024-01-01T10:00:00Z",
    "sessionEnd": "2024-01-01T10:15:00Z",
    "tabSwitches": 3,
    "pageViews": 5,
    "productivityScore": 90.0
  }'
```

## 🛠️ Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm start              # Start production server
npm test               # Run tests
npm run lint           # Run ESLint

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create and run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with sample data
```

### Database Migrations

For production deployments, use migrations instead of `db:push`:

```bash
# Create a new migration
npm run db:migrate

# Apply migrations in production
npx prisma migrate deploy
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Error: Can't reach database server`

**Solution**:
- Check your `DATABASE_URL` format
- Ensure your Supabase project is running
- Verify your database password is correct
- Check if your IP is allowed in Supabase

#### 2. Redis Connection Error

**Error**: `Redis Client Error: connect ECONNREFUSED`

**Solution**:
- Install and start Redis locally:
  ```bash
  # macOS with Homebrew
  brew install redis
  brew services start redis
  
  # Ubuntu/Debian
  sudo apt install redis-server
  sudo systemctl start redis
  ```
- Or use a cloud Redis service and update `REDIS_URL`

#### 3. Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npm run db:generate
```

#### 4. Authentication Errors

**Error**: `Invalid or expired token`

**Solution**:
- Check your `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure JWT tokens are being sent in the correct format
- Verify Supabase project settings

### Debugging

Enable detailed logging:

```bash
# Set log level to debug
LOG_LEVEL=debug npm run dev
```

View Prisma queries:

```bash
# Enable Prisma query logging
DEBUG=prisma:query npm run dev
```

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production database URLs
3. Set secure `JWT_SECRET`
4. Configure production Redis instance

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com)
- [Redis Documentation](https://redis.io/docs)

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the logs for detailed error messages
3. Ensure all environment variables are correctly set
4. Verify your database and Redis connections

---

Happy coding! 🎉 