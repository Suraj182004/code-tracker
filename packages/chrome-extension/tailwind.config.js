/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,tsx,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Developer's Sanctuary Theme Colors
        dev: {
          'primary-bg': '#0a0a0a',      // Deep black background
          'secondary-bg': '#111111',     // Card/panel background
          'tertiary-bg': '#1a1a1a',     // Elevated elements
          'accent-primary': '#00d4ff',   // Cyan - primary actions
          'accent-secondary': '#7c3aed', // Purple - secondary actions
          'accent-success': '#10b981',   // Green - success states
          'accent-warning': '#f59e0b',   // Amber - warnings
          'accent-danger': '#ef4444',    // Red - errors/danger
          'text-primary': '#ffffff',     // Primary text
          'text-secondary': '#a1a1aa',   // Secondary text
          'text-muted': '#71717a',       // Muted text
          'text-inverse': '#000000',     // Text on light backgrounds
        },
        // Programming Language Colors
        languages: {
          javascript: '#f7df1e',
          typescript: '#3178c6',
          python: '#3776ab',
          react: '#61dafb',
          vue: '#4fc08d',
          go: '#00add8',
          rust: '#ce422b',
          java: '#ed8b00',
        },
        // Website Categories
        categories: {
          coding: '#10b981',      // Green for coding sites
          social: '#ef4444',      // Red for social media
          productivity: '#00d4ff', // Cyan for productivity tools
          entertainment: '#f59e0b', // Amber for entertainment
          shopping: '#7c3aed',    // Purple for shopping
          news: '#6366f1',        // Indigo for news
          other: '#71717a',       // Gray for uncategorized
        },
        // Glassmorphism Effects
        glass: {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          shadow: 'rgba(0, 0, 0, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      keyframes: {
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(1.5)", opacity: 0 },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "progress-fill": "progress-fill 0.5s ease-out",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} 