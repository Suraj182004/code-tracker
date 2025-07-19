# System Design - Coding Habit Tracker

## 🏗️ High-Level Architecture

### System Overview
A distributed, scalable coding habit tracking platform with real-time analytics, leveraging Supabase for data persistence and Redis for high-performance caching and leaderboards.

### Core Design Principles
- **Scalability**: Horizontal scaling with stateless services
- **Real-time**: Sub-second updates for active users
- **Privacy**: Minimal data collection with user consent
- **Performance**: < 100ms API response times
- **Reliability**: 99.9% uptime with graceful degradation

## 🔧 Technology Stack

### Primary Services
```
Frontend: React + TypeScript + Vite + Tailwind
API: Node.js + Express + TypeScript
Database: Supabase (PostgreSQL + Real-time + Auth)
Cache: Redis (Leaderboards + Sessions + Analytics)
CDN: Cloudflare (Static assets + Global edge)
Queue: Redis Bull (Background processing)
Monitoring: Sentry + Supabase Analytics
```

### Infrastructure
```
Hosting: Vercel (Frontend + API) + Railway (Redis)
Auth: Supabase Auth + OAuth providers
Storage: Supabase Storage (avatars, exports)
Email: Supabase Edge Functions + Resend
```

## 📊 Database Design (Supabase)

### Schema Architecture
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  settings JSONB DEFAULT '{
    "theme": "system",
    "notifications": true,
    "leaderboard_visible": true,
    "data_sharing": true
  }',
  privacy_settings JSONB DEFAULT '{
    "show_detailed_stats": true,
    "show_activity_status": true,
    "allow_friend_requests": true
  }',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coding sessions (partitioned by month for performance)
CREATE TABLE coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  project_name VARCHAR(200),
  project_path TEXT,
  workspace_name VARCHAR(200),
  language VARCHAR(50),
  framework VARCHAR(50),
  editor_theme VARCHAR(50),
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  lines_modified INTEGER DEFAULT 0,
  keystrokes INTEGER DEFAULT 0,
  characters_typed INTEGER DEFAULT 0,
  files_modified INTEGER DEFAULT 0,
  git_commits INTEGER DEFAULT 0,
  breakpoints_hit INTEGER DEFAULT 0,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN session_end IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (session_end - session_start))::INTEGER
      ELSE 0
    END
  ) STORED,
  productivity_score FLOAT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (session_start);

-- Website sessions (partitioned by month)
CREATE TABLE website_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  url_category VARCHAR(50) DEFAULT 'uncategorized',
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN session_end IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (session_end - session_start))::INTEGER
      ELSE 0
    END
  ) STORED,
  idle_time_seconds INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  productivity_score FLOAT,
  focus_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (session_start);

-- Pre-computed daily statistics
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  coding_time_seconds INTEGER DEFAULT 0,
  website_time_seconds INTEGER DEFAULT 0,
  productive_time_seconds INTEGER DEFAULT 0,
  distraction_time_seconds INTEGER DEFAULT 0,
  deep_work_sessions INTEGER DEFAULT 0,
  languages_used TEXT[] DEFAULT '{}',
  top_domains TEXT[] DEFAULT '{}',
  top_projects TEXT[] DEFAULT '{}',
  lines_of_code INTEGER DEFAULT 0,
  commits_made INTEGER DEFAULT 0,
  productivity_score FLOAT DEFAULT 0,
  focus_score FLOAT DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  goals_completed INTEGER DEFAULT 0,
  achievements_earned TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Goals and achievements
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'daily_coding', 'weekly_hours', 'language_focus'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team/organization support
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  invite_code VARCHAR(20) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES profiles(id),
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for user data access
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON coding_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON coding_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Database Partitioning Strategy
```sql
-- Create monthly partitions for the current year and next year
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..23 LOOP -- 24 months (current + next year)
        start_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' * i;
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'coding_sessions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS %I PARTITION OF coding_sessions 
                       FOR VALUES FROM (%L) TO (%L)', 
                       partition_name, start_date, end_date);
    END LOOP;
END $$;
```

## 🚀 Redis Architecture

### Data Structures & Caching Strategy

#### 1. Leaderboard System
```redis
# Global leaderboards (Sorted Sets)
leaderboard:global:daily:coding_time    # Daily coding time
leaderboard:global:weekly:coding_time   # Weekly coding time  
leaderboard:global:monthly:coding_time  # Monthly coding time
leaderboard:global:daily:productivity   # Daily productivity score
leaderboard:global:streak:longest       # Longest streaks

# Language-specific leaderboards
leaderboard:language:javascript:weekly
leaderboard:language:python:weekly
leaderboard:language:typescript:weekly

# Team leaderboards
leaderboard:team:{team_id}:weekly:coding_time
leaderboard:team:{team_id}:monthly:productivity

# Redis Sorted Set structure:
# Score: metric value (coding time in seconds, productivity score)
# Member: user_id
# Example: ZADD leaderboard:global:daily:coding_time 7200 user_123
```

#### 2. User Session Cache
```redis
# Active user sessions (Hash)
user:session:{user_id} → {
  "current_session_id": "uuid",
  "session_start": "timestamp",
  "current_project": "project_name",
  "current_language": "javascript",
  "is_coding": true,
  "last_activity": "timestamp"
}

# Daily user stats cache (Hash)
user:stats:daily:{user_id}:{date} → {
  "coding_time": 7200,
  "website_time": 3600,
  "productivity_score": 85.5,
  "languages": ["javascript", "python"],
  "top_domains": ["github.com", "stackoverflow.com"]
}

# User preferences cache (TTL: 1 hour)
user:prefs:{user_id} → {
  "theme": "dark",
  "notifications": true,
  "timezone": "UTC"
}
```

#### 3. Real-time Analytics
```redis
# Live counters (String with expiration)
live:active_users                    # Current active users count
live:coding_now                      # Users currently coding
live:languages:{language}:active     # Active users per language

# Trending data (Sorted Sets with TTL)
trending:languages:hourly            # Most used languages (last hour)
trending:projects:daily              # Most active projects (last day)
trending:domains:hourly              # Most visited domains (last hour)

# Global statistics cache (TTL: 5 minutes)
stats:global:realtime → {
  "total_users": 50000,
  "active_today": 1250,
  "total_coding_time_today": 45000,
  "top_language_today": "javascript"
}
```

### Redis Performance Optimizations
```redis
# Memory optimization
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy allkeys-lru

# Enable keyspace notifications for real-time updates
CONFIG SET notify-keyspace-events Ex

# Connection pooling
CONFIG SET tcp-keepalive 60
```

## 🔄 Data Flow Architecture

### Real-time Data Pipeline
```
1. Extension Data Collection
   ├── Local buffering (5-minute batches)
   ├── Compression (gzip)
   └── Retry logic with exponential backoff

2. API Gateway Processing
   ├── Authentication (JWT validation)
   ├── Rate limiting (Redis-based)
   ├── Data validation (Joi schemas)
   └── Request queuing (Redis Bull)

3. Background Processing
   ├── Session aggregation
   ├── Productivity scoring
   ├── Leaderboard updates
   └── Real-time notifications

4. Real-time Updates
   ├── Supabase Realtime (dashboard updates)
   ├── Redis Pub/Sub (leaderboard changes)
   └── WebSocket events (live stats)
```

### Leaderboard Update Algorithm
```typescript
// Efficient leaderboard update process
async function updateLeaderboards(userId: string, sessionData: SessionData) {
  const pipeline = redis.pipeline();
  
  // Update multiple leaderboards atomically
  const score = calculateScore(sessionData);
  const timeframe = getCurrentTimeframe();
  
  // Global leaderboards
  pipeline.zadd(`leaderboard:global:${timeframe}:coding_time`, score.codingTime, userId);
  pipeline.zadd(`leaderboard:global:${timeframe}:productivity`, score.productivity, userId);
  
  // Language-specific leaderboards
  if (sessionData.language) {
    pipeline.zadd(`leaderboard:language:${sessionData.language}:${timeframe}`, score.codingTime, userId);
  }
  
  // Team leaderboards (if user is in teams)
  const userTeams = await getUserTeams(userId);
  for (const teamId of userTeams) {
    pipeline.zadd(`leaderboard:team:${teamId}:${timeframe}:coding_time`, score.codingTime, userId);
  }
  
  // Set expiration for time-based leaderboards
  pipeline.expire(`leaderboard:global:${timeframe}:coding_time`, getExpirationTime(timeframe));
  
  await pipeline.exec();
}
```

## 📈 Scalability Architecture

### Horizontal Scaling Strategy
```
1. Stateless API Services
   ├── Load balancer (Cloudflare)
   ├── Auto-scaling containers
   └── Shared Redis state

2. Database Scaling
   ├── Supabase read replicas
   ├── Table partitioning by date
   ├── Connection pooling
   └── Query optimization

3. Redis Scaling
   ├── Redis cluster mode
   ├── Separate instances per use case
   ├── Data sharding by user_id
   └── Backup and persistence

4. CDN & Edge Computing
   ├── Static asset caching
   ├── API response caching
   ├── Geographic distribution
   └── Edge functions for auth
```

### Performance Targets
```
API Response Times:
├── Authentication: < 50ms
├── Data ingestion: < 100ms
├── Dashboard queries: < 200ms
├── Leaderboard queries: < 50ms
└── Real-time updates: < 100ms

Throughput:
├── Concurrent users: 10,000+
├── API requests/second: 1,000+
├── Real-time connections: 5,000+
└── Data ingestion rate: 100 sessions/second

Availability:
├── Uptime: 99.9%
├── Recovery time: < 5 minutes
├── Data durability: 99.999%
└── Backup frequency: Every 6 hours
```

## 🔐 Security & Privacy

### Data Protection
```
1. Authentication
   ├── Supabase Auth with MFA support
   ├── JWT tokens with short expiration
   ├── API key rotation for extensions
   └── OAuth provider verification

2. Data Privacy
   ├── Minimal data collection
   ├── URL hashing for website tracking
   ├── User consent for all tracking
   ├── GDPR compliance (data export/deletion)
   └── Anonymized leaderboard data

3. Network Security
   ├── HTTPS/TLS 1.3 encryption
   ├── API rate limiting
   ├── DDoS protection via Cloudflare
   ├── Request validation and sanitization
   └── SQL injection prevention (RLS)

4. Infrastructure Security
   ├── Environment variable encryption
   ├── Database connection encryption
   ├── Redis AUTH and TLS
   ├── Regular security audits
   └── Dependency vulnerability scanning
```

## 📊 Monitoring & Analytics

### Observability Stack
```
Application Monitoring:
├── Sentry (Error tracking)
├── Winston (Structured logging)
├── Supabase Analytics (Usage metrics)
└── Custom dashboards (Grafana)

Performance Monitoring:
├── API response times
├── Database query performance
├── Redis hit/miss ratios
├── Memory and CPU usage
└── Real-time connection counts

Business Metrics:
├── Daily/Weekly/Monthly active users
├── Feature adoption rates
├── User retention cohorts
├── Revenue metrics (if applicable)
└── Support ticket volume
```

This system design ensures a scalable, performant, and secure coding habit tracker that can handle thousands of concurrent users while providing real-time insights and maintaining user privacy. 