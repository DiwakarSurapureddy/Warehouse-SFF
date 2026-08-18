/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#090d16',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          500: '#f59e0b',
        },
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-indigo': '0 0 20px -5px rgba(99, 102, 241, 0.4)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.4)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
