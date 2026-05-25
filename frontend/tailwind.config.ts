import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0d1b2a',
          soft: '#1b2a3a',
          muted: '#5b6b7b',
        },
        paper: '#f6f4ef',
        surface: '#ffffff',
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#0e9f6e',
          600: '#057a55',
          700: '#046c4e',
          800: '#03543f',
        },
        edge: '#e6e1d7',
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,27,42,0.04), 0 8px 24px -12px rgba(13,27,42,0.12)',
        lift: '0 12px 40px -16px rgba(13,27,42,0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
