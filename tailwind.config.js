/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['"Press Start 2P"', 'cursive'],
        display: ['"Rubik"', 'sans-serif'],
      },
      colors: {
        neon: {
          green: '#39ff14',
          pink: '#ff2bd6',
          blue: '#00e5ff',
          yellow: '#faff00',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.25)',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 15px rgba(57,255,20,0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(57,255,20,0.8)' },
        },
      },
      animation: { pulseGlow: 'pulseGlow 2s ease-in-out infinite' },
    },
  },
  plugins: [],
};
