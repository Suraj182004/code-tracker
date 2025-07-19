# Web Platform - Coding Habit Tracker

A modern React web application built with the "Developer's Sanctuary" theme - dark aesthetics inspired by VS Code, GitHub, and Linear.

## 🚀 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom Developer's Sanctuary theme
- **Supabase** for authentication and real-time features
- **Zustand** for state management
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Framer Motion** for animations
- **Recharts** for data visualization

## 🎨 Design System

Based on the "Developer's Sanctuary" theme:
- **Dark aesthetics** with deep black backgrounds
- **Cyan (#00d4ff)** and **Purple (#7c3aed)** accent colors
- **Programming language specific colors** (JS yellow, TS blue, etc.)
- **Glassmorphism effects** for modern UI elements
- **Inter font** for UI, **JetBrains Mono** for code

## 🛠️ Installation

```bash
# Navigate to web platform
cd packages/web-platform

# Install dependencies
npm install
```

## ⚙️ Configuration

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure environment variables:**
   ```env
   # Required for Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Backend API endpoint
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. **Get Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create or select your project
   - Go to Settings → API
   - Copy the Project URL and anon public key

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layouts/          # Layout components
│   └── auth/             # Authentication components
├── pages/                # Page components
│   ├── auth/             # Login/Register pages
│   └── ...               # Dashboard, Analytics, etc.
├── stores/               # Zustand state stores
├── lib/                  # Utilities and configurations
├── index.css             # Global styles with theme
└── main.tsx              # Application entry point
```

## 🎯 Features Implemented

### Current Features
✅ **Landing Page** with Developer's Sanctuary theme  
✅ **Dark theme** with glassmorphism effects  
✅ **Responsive design** for all screen sizes  
✅ **Routing structure** for all planned pages  
✅ **Supabase integration** setup  
✅ **Authentication store** with Zustand  
✅ **Development environment** ready  

### Coming Soon
🔄 **Authentication UI** (Login/Register forms)  
🔄 **Dashboard** with real-time stats  
🔄 **Analytics** with interactive charts  
🔄 **Leaderboard** with rankings  
🔄 **Profile management**  
🔄 **Goals and challenges** system  

## 🎨 Theme Colors

```css
/* Developer's Sanctuary Theme */
--dev-primary-bg: #0a0a0a      /* Deep black background */
--dev-secondary-bg: #111111     /* Card/panel background */
--dev-tertiary-bg: #1a1a1a      /* Elevated elements */
--dev-accent-primary: #00d4ff   /* Cyan - primary actions */
--dev-accent-secondary: #7c3aed /* Purple - secondary actions */
--dev-accent-success: #10b981   /* Green - success states */
--dev-accent-warning: #f59e0b   /* Amber - warnings */
--dev-accent-danger: #ef4444    /* Red - errors/danger */
```

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run type-check      # Run TypeScript check
```

## 🔗 Integration

### Backend API
The web platform connects to the backend API running on `http://localhost:3001`. Make sure the backend is running for full functionality.

### Supabase Features
- **Authentication** - User registration and login
- **Real-time subscriptions** - Live dashboard updates
- **Database queries** - Session data and analytics

## 🚀 Next Steps

1. **Start the backend API** (see `packages/backend-api/README.md`)
2. **Configure your Supabase project**
3. **Run the web platform** with `npm run dev`
4. **Visit** `http://localhost:5173` to see the landing page

---

Built with ❤️ following the Developer's Sanctuary design system 