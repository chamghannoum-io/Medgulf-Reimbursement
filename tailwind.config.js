/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4fa',
          100: '#d5e0f5',
          200: '#a8c0e8',
          300: '#7aa0d9',
          400: '#4d7fca',
          500: '#2a5ea8',
          600: '#1e4080',
          700: '#162e5c',
          800: '#0e1e3a',
        },
      },
      animation: {
        'spin-slow': 'spin 1.4s linear infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
