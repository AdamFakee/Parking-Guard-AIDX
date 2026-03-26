export const COLORS = {
  // Legacy colors (kept for compatibility)
  text: {
    primary: {
      red: '#9B0000',
      black: '#000000',
      white: '#FFFFFF',
    },
    secondary: '#707070',
  },
  background: {
    headerGradient: {
      start: '#FFD848',
      end: '#FDAC41',
    },
    primaryGradient: {
      start: '#FFE149',
      end: '#F72B2B',
    },
    white: '#FFFFFF',
    secondary: '#D9D9D9',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  yellow: '#FFDD00',
  primary: '#9B0000',

  // New App Theme
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
} as const;


export const GRADIENTS = {
  main: ['#0c1220', '#0a0e17', '#111827'],
  blue: ['#3B82F6', '#2563EB'],
  green: ['#22C55E', '#16A34A'],
  orange: ['#F59E0B', '#D97706'],
  purple: ['#8B5CF6', '#7C3AED'],
} as const;

export const SHADOW = {
  bottom: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 1,
  },
  up: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
  },
  glowBlue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glowGreen: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glowOrange: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;