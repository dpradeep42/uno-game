/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px #22c55e' },
          '50%': { boxShadow: '0 0 18px 6px #22c55e' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        glow: 'glow 1.5s ease-in-out infinite',
        pulse2: 'pulse2 1s ease-in-out infinite',
        slideUp: 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
