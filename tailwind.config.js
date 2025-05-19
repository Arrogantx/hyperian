/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'hyper-cyan': '#00FFFF',
        'hyper-magenta': '#FF00FF',
        'hyper-yellow': '#FFFF00',
        'hyper-black': '#121212',
        'hyper-blue': '#0066FF',
        'hyper-green': '#00FF66',
        'hyper-red': '#FF0066'
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive', 'monospace']
      },
      animation: {
        'pixel-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pixel-float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'pixel-grid': "url('/assets/pixel-grid.png')",
      }
    },
  },
  plugins: [],
};