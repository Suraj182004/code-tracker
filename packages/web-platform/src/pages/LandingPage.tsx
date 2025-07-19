import { Link } from 'react-router-dom'
import { Code2, BarChart3, Trophy, Zap } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-dev-primary-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-dev-accent-primary/10 via-transparent to-dev-accent-secondary/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Hero Content */}
            <h1 className="text-4xl md:text-6xl font-bold text-dev-text-primary mb-6">
              Track Your{' '}
              <span className="gradient-primary bg-clip-text text-transparent">
                Coding Journey
              </span>
            </h1>
            
            <p className="text-xl text-dev-text-secondary max-w-3xl mx-auto mb-8">
              Monitor your coding habits, boost productivity with real-time analytics, 
              and compete with developers worldwide in your personal sanctuary.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-dev-accent-primary text-dev-text-inverse font-semibold rounded-lg hover-lift hover-glow transition-all duration-200"
              >
                Start Tracking Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-dev-accent-primary text-dev-accent-primary font-semibold rounded-lg hover:bg-dev-accent-primary hover:text-dev-text-inverse transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-dev-accent-primary">10K+</div>
                <div className="text-dev-text-secondary">Developers Tracking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-dev-accent-success">1M+</div>
                <div className="text-dev-text-secondary">Hours Monitored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-dev-accent-secondary">50+</div>
                <div className="text-dev-text-secondary">Languages Supported</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-dev-secondary-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dev-text-primary mb-4">
              Everything You Need to Level Up
            </h2>
            <p className="text-xl text-dev-text-secondary">
              Built for developers, by developers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Cards */}
            <div className="glass p-6 rounded-lg hover-lift">
              <div className="w-12 h-12 bg-dev-accent-primary rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-dev-text-inverse" />
              </div>
              <h3 className="text-lg font-semibold text-dev-text-primary mb-2">
                Real-time Tracking
              </h3>
              <p className="text-dev-text-secondary">
                Monitor your coding activity across all projects and languages automatically.
              </p>
            </div>

            <div className="glass p-6 rounded-lg hover-lift">
              <div className="w-12 h-12 bg-dev-accent-success rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-dev-text-inverse" />
              </div>
              <h3 className="text-lg font-semibold text-dev-text-primary mb-2">
                Deep Analytics
              </h3>
              <p className="text-dev-text-secondary">
                Gain insights into your productivity patterns and coding habits.
              </p>
            </div>

            <div className="glass p-6 rounded-lg hover-lift">
              <div className="w-12 h-12 bg-dev-accent-secondary rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-dev-text-inverse" />
              </div>
              <h3 className="text-lg font-semibold text-dev-text-primary mb-2">
                Global Leaderboard
              </h3>
              <p className="text-dev-text-secondary">
                Compete with developers worldwide and climb the rankings.
              </p>
            </div>

            <div className="glass p-6 rounded-lg hover-lift">
              <div className="w-12 h-12 bg-dev-accent-warning rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-dev-text-inverse" />
              </div>
              <h3 className="text-lg font-semibold text-dev-text-primary mb-2">
                Boost Productivity
              </h3>
              <p className="text-dev-text-secondary">
                Set goals, track streaks, and build better coding habits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dev-tertiary-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-dev-text-primary mb-4">
              Ready to Transform Your Coding Habits?
            </h3>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 bg-dev-accent-primary text-dev-text-inverse font-semibold rounded-lg hover-lift hover-glow transition-all duration-200"
            >
              Get Started Now
            </Link>
            <p className="mt-8 text-dev-text-muted">
              © 2024 Coding Habit Tracker. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 