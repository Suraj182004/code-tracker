# Coding Habit Tracker - Project Planning

## 🎯 Project Overview

A comprehensive coding habit tracking system that monitors both coding activity and website usage to help developers build better habits and stay productive.

## 🏗️ System Architecture

### Core Components

1. **Chrome Extension** - Website time tracking
2. **VS Code Extension** - Coding activity tracking  
3. **Web Platform** - Data visualization, stats, leaderboard
4. **Backend API** - Data storage and user management
5. **Database** - User data, statistics, and leaderboard information

## 📋 Detailed Features

### Chrome Extension Features
- **Website Time Tracking**
  - Track time spent on specific websites (configurable)
  - Categorize websites (coding-related, social media, productivity, etc.)
  - Real-time tracking with tab switching detection
  - Idle time detection
  - Daily/weekly/monthly time summaries
  - Productivity score calculation
  - Block distracting websites during "focus mode"
  - Custom website categories and rules

### VS Code Extension Features
- **Coding Activity Tracking**
  - Lines of code written/deleted
  - Time spent coding per project/language
  - Keystrokes and mouse activity
  - File types and languages used
  - Git commits correlation
  - Break reminders and productivity tips
  - Coding streaks and milestones
  - Project-based time allocation

### Web Platform Features
- **Personal Dashboard**
  - Daily/weekly/monthly coding statistics
  - Website usage breakdown
  - Productivity trends and insights
  - Goal setting and progress tracking
  - Habit streaks visualization
  - Time allocation charts

- **Global Leaderboard**
  - Top coders by hours/week
  - Language-specific leaderboards
  - Team/organization rankings
  - Achievement badges system
  - Privacy controls for participation

- **Analytics & Insights**
  - Productivity patterns analysis
  - Best coding hours identification
  - Distraction analysis
  - Goal achievement tracking
  - Weekly/monthly reports

## 🛠️ Technical Stack

### Frontend (Web Platform)
- **Framework**: React.js with TypeScript
- **UI Library**: Tailwind CSS + Shadcn/ui
- **Charts**: Chart.js or Recharts
- **State Management**: Zustand or Redux Toolkit
- **Build Tool**: Vite

### Backend API
- **Runtime**: Node.js with Express.js / Fastify
- **Database**: Supabase (PostgreSQL + Real-time + Auth)
- **Cache Layer**: Redis (leaderboards, sessions, analytics)
- **Authentication**: Supabase Auth + JWT
- **Real-time**: Supabase Realtime + WebSockets
- **Hosting**: Vercel/Railway + CDN (Cloudflare)
- **Message Queue**: Redis Bull Queue for async processing

### Chrome Extension
- **Manifest**: V3
- **Language**: TypeScript
- **Build**: Webpack
- **Storage**: Chrome Storage API
- **Background**: Service Workers

### VS Code Extension
- **Language**: TypeScript
- **API**: VS Code Extension API
- **Build**: webpack/esbuild
- **Storage**: VS Code workspace state

## 📊 Database Schema (Supabase)

### Users Table (Supabase Auth + Extended Profile)
```sql
-- Supabase auth.users table (managed)
-- Extended profile table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"leaderboard_visible": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Coding Sessions Table (Partitioned by date)
```sql
CREATE TABLE coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  project_name VARCHAR(200),
  project_path TEXT,
  language VARCHAR(50),
  framework VARCHAR(50),
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  lines_modified INTEGER DEFAULT 0,
  keystrokes INTEGER DEFAULT 0,
  characters_typed INTEGER DEFAULT 0,
  files_modified INTEGER DEFAULT 0,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (session_end - session_start))
  ) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (session_start);

-- Create monthly partitions
CREATE TABLE coding_sessions_y2024m01 PARTITION OF coding_sessions
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Website Sessions Table (Partitioned by date)
```sql
CREATE TABLE website_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  url_hash VARCHAR(64), -- For privacy, store hash of full URL
  category VARCHAR(50) DEFAULT 'uncategorized',
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (session_end - session_start))
  ) STORED,
  idle_time_seconds INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  productivity_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (session_start);
```

### Daily Aggregations (Pre-computed for performance)
```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  total_coding_seconds INTEGER DEFAULT 0,
  total_website_seconds INTEGER DEFAULT 0,
  total_productive_seconds INTEGER DEFAULT 0,
  total_distracting_seconds INTEGER DEFAULT 0,
  languages_used TEXT[] DEFAULT '{}',
  top_websites TEXT[] DEFAULT '{}',
  productivity_score FLOAT DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  goals_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### Leaderboards (Cached in Redis)
```sql
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  category VARCHAR(50) NOT NULL, -- 'coding_time', 'productivity', 'language'
  snapshot_date DATE NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🏗️ Production System Architecture

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome Ext    │    │   VS Code Ext   │    │  Web Platform   │
│   (Client)      │    │   (Client)      │    │   (Frontend)    │
└─────┬───────────┘    └─────┬───────────┘    └─────┬───────────┘
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer  │
                    │   (Cloudflare)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway    │
                    │   (Rate Limit)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ Auth    │         │ Data    │         │Analytics│
    │Service  │         │Service  │         │Service  │
    └────┬────┘         └────┬────┘         └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
         │Supabase │    │  Redis  │    │ Message │
         │(Primary)│    │ (Cache) │    │ Queue   │
         └─────────┘    └─────────┘    └─────────┘
```

### Service Responsibilities

#### 1. Authentication Service
- User registration/login via Supabase Auth
- JWT token validation and refresh
- OAuth integration (Google, GitHub, Discord)
- Rate limiting and security

#### 2. Data Ingestion Service
- Batch processing of tracking data
- Data validation and sanitization
- Real-time session management
- Conflict resolution for concurrent sessions

#### 3. Analytics Service
- Daily/weekly/monthly aggregation
- Productivity score calculation
- Trend analysis and insights
- Real-time statistics updates

#### 4. Leaderboard Service
- Redis-based ranking system
- Real-time leaderboard updates
- Privacy-aware ranking
- Category-specific leaderboards

## 🔄 Data Flow & Processing Pipeline

### Real-time Data Ingestion
```
Extensions → API Gateway → Data Service → Supabase + Redis
                ↓
         Background Jobs (Redis Queue)
                ↓
    Aggregation & Analytics Processing
                ↓
         Update Leaderboards (Redis)
```

### Detailed Flow:

1. **Data Collection**
   - Extensions batch data locally (5-minute intervals)
   - Send compressed JSON payloads to API
   - Handle offline scenarios with local queue

2. **API Processing**
   - Validate and authenticate requests
   - Rate limit by user/IP
   - Queue heavy processing tasks
   - Return immediate acknowledgment

3. **Background Processing**
   - Process raw sessions into aggregated stats
   - Update daily/weekly/monthly summaries
   - Calculate productivity scores
   - Update leaderboard rankings

4. **Real-time Updates**
   - Supabase Realtime for live dashboard updates
   - Redis pub/sub for leaderboard changes
   - WebSocket connections for active users

## 🚀 Scalability Features

### Database Optimization
- **Table Partitioning**: Monthly partitions for sessions
- **Indexing Strategy**: Optimized queries for common patterns
- **Read Replicas**: Separate read/write operations
- **Connection Pooling**: PgBouncer for connection management

### Caching Strategy
```redis
# User sessions cache (TTL: 1 hour)
user:sessions:{user_id}:{date} → compressed session data

# Leaderboard cache (TTL: 15 minutes)
leaderboard:daily:coding_time → sorted set
leaderboard:weekly:productivity → sorted set
leaderboard:monthly:languages:{language} → sorted set

# User stats cache (TTL: 5 minutes)
user:stats:{user_id}:{period} → aggregated statistics

# Hot data cache (TTL: 1 minute)
trending:languages → most active languages
trending:projects → most active projects
```

### Performance Optimizations
- **CDN**: Static assets via Cloudflare
- **Image Optimization**: Avatar/badge images
- **Bundle Splitting**: Lazy-loaded dashboard components
- **Database Connection Pooling**: Supabase built-in pooling
- **Query Optimization**: Materialized views for complex analytics

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure and repositories
- [ ] Create basic backend API with authentication
- [ ] Set up database schema and migrations
- [ ] Create basic web platform with login/register

### Phase 2: Core Tracking (Week 3-4)
- [ ] Develop Chrome extension for website tracking
- [ ] Create VS Code extension for coding activity
- [ ] Implement data collection APIs
- [ ] Basic dashboard with personal stats

### Phase 3: Analytics & Insights (Week 5-6)
- [ ] Advanced analytics and charts
- [ ] Productivity insights and recommendations
- [ ] Goal setting and tracking features
- [ ] Data export functionality

### Phase 4: Social Features (Week 7-8)
- [ ] Global leaderboard implementation
- [ ] Team/organization features
- [ ] Achievement system and badges
- [ ] Social sharing capabilities

### Phase 5: Enhancement & Polish (Week 9-10)
- [ ] Performance optimizations
- [ ] UI/UX improvements
- [ ] Comprehensive testing
- [ ] Documentation and deployment

## 🔐 Privacy & Security

### Data Privacy
- Minimal data collection (no personal browsing content)
- User consent for all tracking
- Data anonymization for leaderboards
- GDPR compliance
- Data export and deletion options

### Security Measures
- JWT token authentication
- HTTPS encryption
- Input validation and sanitization
- Rate limiting
- Secure storage practices

## 📱 User Experience

### Chrome Extension UX
- Minimal, non-intrusive popup interface
- Quick settings and category management
- Real-time productivity notifications
- Easy enable/disable toggle

### VS Code Extension UX
- Status bar integration
- Command palette commands
- Settings integration
- Non-disruptive data collection

### Web Platform UX
- Clean, modern dashboard design
- Responsive design for all devices
- Dark/light theme support
- Intuitive navigation and data visualization

## 🎯 Success Metrics

### Engagement Metrics
- Daily active users
- Session duration
- Feature adoption rates
- User retention

### Product Metrics
- Accuracy of time tracking
- User productivity improvements
- Goal achievement rates
- Community engagement

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- VS Code
- Chrome/Chromium browser

### Repository Structure
```
coding-habit-tracker/
├── packages/
│   ├── chrome-extension/
│   ├── vscode-extension/
│   ├── web-platform/
│   ├── backend-api/
│   └── shared/
├── docs/
├── scripts/
└── README.md
```

## 📈 Future Enhancements

### Advanced Features
- AI-powered productivity insights
- Integration with popular dev tools (GitHub, GitLab, Jira)
- Mobile app for tracking
- Team collaboration features
- Custom productivity rules and automation

### Integrations
- Slack/Discord notifications
- Calendar integration
- Pomodoro timer integration
- Music/focus app integrations

---

This planning document serves as a roadmap for building a comprehensive coding habit tracker that will help developers improve their productivity and build better coding habits. 