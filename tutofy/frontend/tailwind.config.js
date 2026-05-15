/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4c6eff',
        'primary-light': 'rgba(76,110,255,0.08)',
        purple: '#935bf5',
        teal: '#00beb7',
        orange: '#ff8032',
        yellow: '#ffce22',
        dark: '#181b26',
        body: '#4c5162',
        muted: '#8a90a1',
        'light-muted': '#d2d4d9',
        bg: '#f8f9fc',
        surface: '#fafafc',
        white: '#ffffff',
        border: '#f3f4f7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'btn': '10px',
        'card': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'cta': '0 10px 15px -3px rgba(76,110,255,0.35), 0 4px 6px -2px rgba(76,110,255,0.35)',
      },
    },
  },
  plugins: [],
}