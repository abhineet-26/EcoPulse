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
        eco: {
          primary: '#00D4A0',
          secondary: '#00B4D8',
          accent: '#7C3AED',
          dark: '#0A0F1E',
          darker: '#060C18',
          surface: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.12)',
          text: '#F0F4FF',
          muted: '#8892B0',
          danger: '#FF6B6B',
          warning: '#FFD93D',
          success: '#00D4A0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-eco': 'linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 50%, #0A1628 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(0,212,160,0.1), rgba(124,58,237,0.1))',
        'gradient-primary': 'linear-gradient(135deg, #00D4A0, #00B4D8)',
        'gradient-accent': 'linear-gradient(135deg, #7C3AED, #A855F7)',
        'gradient-hero': 'radial-gradient(ellipse at 50% 50%, rgba(0,212,160,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.37)',
        'glass-sm': '0 4px 16px rgba(0,0,0,0.2)',
        'glow-eco': '0 0 30px rgba(0,212,160,0.3)',
        'glow-accent': '0 0 30px rgba(124,58,237,0.3)',
        'card-3d': '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-sm': '10px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-eco': 'pulse-eco 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'orb-float': 'orb-float 8s ease-in-out infinite',
        'number-roll': 'number-roll 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-eco': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,212,160,0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(0,212,160,0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 10px) scale(0.95)' },
        },
        'number-roll': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
