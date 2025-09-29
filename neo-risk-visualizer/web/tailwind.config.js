/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space': {
          'dark': '#0a0a0f',
          'blue': '#1e3a8a',
          'purple': '#4c1d95',
          'navy': '#1e1b4b',
        },
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'success': '#10b981',
        'asteroid': '#a16207',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 25%, #4c1d95 50%, #1e3a8a 75%, #0a0a0f 100%)',
        'panel-gradient': 'linear-gradient(145deg, rgba(0,0,0,0.7) 0%, rgba(30,27,75,0.5) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

