/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'farm-green': '#2E7D32',
        'farm-light-green': '#4CAF50',
        'apple-red': '#E53935',
        'apple-dark-red': '#C62828',
        'diamond-blue': '#00A3FF',
        'farm-cream': '#FFFDF5',
        'farm-wood': '#8D6E63'
      },
      keyframes: {
        floatFade: {
          '0%': { opacity: '1', transform: 'translateY(0px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(1.2)' },
        }
      },
      animation: {
        'float-fade': 'floatFade 0.8s ease-out forwards',
      }
    },
  },
  plugins: [],
}
