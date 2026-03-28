/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px #22c55e, 0 0 0 0 #22c55e40' },
          '50%': { boxShadow: '0 0 22px 8px #22c55e, 0 0 40px 12px #22c55e30' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        slideUp: {
          from: { transform: 'translateY(50px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        cardLand: {
          '0%':   { transform: 'translateY(-60px) scale(1.25) rotate(-10deg)', opacity: '0.5' },
          '55%':  { transform: 'translateY(8px) scale(0.95) rotate(3deg)',     opacity: '1'   },
          '75%':  { transform: 'translateY(-4px) scale(1.02) rotate(-1deg)'                   },
          '100%': { transform: 'translateY(0) scale(1) rotate(0deg)'                          },
        },
        cardDraw: {
          '0%':   { transform: 'translateX(-50px) translateY(30px) scale(0.6) rotate(-10deg)', opacity: '0' },
          '65%':  { transform: 'translateX(5px) translateY(-5px) scale(1.06) rotate(2deg)',    opacity: '1' },
          '100%': { transform: 'translateX(0) translateY(0) scale(1) rotate(0deg)'                         },
        },
        deckShake: {
          '0%,100%': { transform: 'rotate(0deg) translateY(0)' },
          '20%':     { transform: 'rotate(-6deg) translateY(-4px)' },
          '40%':     { transform: 'rotate(6deg) translateY(-6px)' },
          '60%':     { transform: 'rotate(-4deg) translateY(-2px)' },
          '80%':     { transform: 'rotate(3deg) translateY(-1px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        winPop: {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '70%':  { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        confetti: {
          '0%':   { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(200px) rotate(720deg)', opacity: '0' },
        },
        turnFlash: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.7)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(34,197,94,0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        glow:      'glow 1.5s ease-in-out infinite',
        pulse2:    'pulse2 1s ease-in-out infinite',
        slideUp:   'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cardLand:  'cardLand 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cardDraw:  'cardDraw 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        deckShake: 'deckShake 0.45s ease-in-out',
        float:     'float 3s ease-in-out infinite',
        winPop:    'winPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        confetti:  'confetti 1.2s ease-in forwards',
        turnFlash: 'turnFlash 1s ease-in-out infinite',
        fadeIn:    'fadeIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
