#!/bin/bash

# Backend API Setup Script
# This script automates the initial setup of the Coding Habit Tracker Backend API

set -e  # Exit on any error

echo "🚀 Starting Backend API Setup..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm version
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Setting up environment configuration..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "🔧 IMPORTANT: Please edit .env file with your actual values:"
    echo "   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
    echo "   - DATABASE_URL and DIRECT_URL"
    echo "   - REDIS_URL (if using external Redis)"
    echo "   - JWT_SECRET (generate a strong secret)"
    echo ""
    read -p "Press Enter after you've configured your .env file..."
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo ""
echo "🔄 Generating Prisma client..."
npm run db:generate

# Check if we can connect to database
echo ""
echo "🗄️  Setting up database..."
echo "Attempting to push schema to database..."

if npm run db:push; then
    echo "✅ Database schema pushed successfully"
    
    # Ask about seeding
    echo ""
    read -p "📊 Would you like to seed the database with sample data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run db:seed
        echo "✅ Database seeded with sample data"
    else
        echo "⏭️  Skipping database seeding"
    fi
else
    echo "❌ Failed to push database schema"
    echo "Please check your DATABASE_URL and ensure your Supabase project is accessible"
    echo ""
    echo "Manual steps:"
    echo "1. Verify your .env configuration"
    echo "2. Run: npm run db:push"
    echo "3. Run: npm run db:seed (optional)"
    exit 1
fi

# Check Redis connection (optional)
echo ""
echo "🔄 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running locally"
    else
        echo "⚠️  Redis is not running locally"
        echo "You can:"
        echo "  - Start local Redis: brew services start redis (macOS) or sudo systemctl start redis (Linux)"
        echo "  - Use a cloud Redis service and update REDIS_URL in .env"
    fi
else
    echo "⚠️  Redis CLI not found"
    echo "If you're using a cloud Redis service, that's fine!"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review your .env configuration"
echo "2. Start the development server: npm run dev"
echo "3. Test the API: curl http://localhost:3001/health"
echo ""
echo "📚 For more information, see the README.md file"
echo ""
echo "🚀 Happy coding!" 