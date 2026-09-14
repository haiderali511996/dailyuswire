import type { Config } from 'tailwindcss';

/**
 * Palette is sampled straight from the brand assets:
 * navy #03305f from the wordmark, red #b3163c from the square dot.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3f9',
          100: '#d6e2f0',
          200: '#adc4e0',
          300: '#7b9dc9',
          400: '#4a74ab',
          500: '#2a5389',
          600: '#1a4073',
          700: '#0d3564',
          800: '#03305f',
          900: '#022446',
          950: '#01162c',
        },
        flag: {
          50: '#fdf2f5',
          100: '#fbe0e7',
          200: '#f6c1d0',
          300: '#ee91ab',
          400: '#e25a7f',
          500: '#d0345c',
          600: '#b3163c',
          700: '#951233',
          800: '#7c122e',
          900: '#69132b',
        },
        ink: {
          DEFAULT: '#121417',
          muted: '#4a5159',
          faint: '#767d85',
        },
        paper: '#ffffff',
        wash: '#f5f6f8',
        rule: '#e0e3e8',
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-body)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      maxWidth: {
        shell: '1280px',
        prose: '44rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 4px 16px -8px rgba(16,24,40,.12)',
        pop: '0 12px 40px -12px rgba(16,24,40,.28)',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        ticker: 'ticker 45s linear infinite',
        'fade-up': 'fade-up .3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
