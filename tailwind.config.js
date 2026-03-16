/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          darker: '#0A0E17',
          dark: '#0c1220',
          base: '#111827',
          surface: '#1E293B',
          camera: '#1a1a2e',
        },
        slate: {
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
        },
        brand: {
          blue: '#3B82F6',
          green: '#22C55E',
          orange: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
          emerald: '#10B981',
        },
      },
      spacing: {
        xs: '5px',
        sm: '10px',
        md: '16px',
        header: '64px',
      },
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        screenName: ['28px', { fontFamily: 'DM Sans' }],
        pageTitle: ['30px', { fontFamily: 'DM Sans' }],
        sectionTitle: ['24px', { fontFamily: 'DM Sans' }],
        mainContent: ['20px', { fontFamily: 'DM Sans' }],
        blogContent: ['16px', { fontFamily: 'DM Sans' }],
        shortDesc: ['18px', { fontFamily: 'DM Sans' }],
        note1: ['15px', { fontFamily: 'DM Sans' }],
        note: ['12px', { fontFamily: 'DM Sans' }],
        button: ['18px', { fontFamily: 'DM Sans' }],
        medium: ['18px', { fontFamily: 'DM Sans' }],
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
        '2xl': '14px',
        '3xl': '16px',
        '4xl': '20px',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #0c1220 0%, #0a0e17 50%, #111827 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3B82F6, #2563EB)',
        'gradient-green': 'linear-gradient(135deg, #22C55E, #16A34A)',
        'gradient-orange': 'linear-gradient(135deg, #F59E0B, #D97706)',
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      },
      boxShadow: {
        'glow-blue': '0 4px 20px rgba(59, 130, 246, 0.25)',
        'glow-green': '0 4px 16px rgba(34, 197, 94, 0.25)',
        'glow-orange': '0 4px 20px rgba(245, 158, 11, 0.25)',
        'glow-purple': '0 4px 16px rgba(139, 92, 246, 0.25)',
      },
    },
  },
  plugins: [],
}

