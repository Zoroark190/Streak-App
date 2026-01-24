/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#E3F2FD',
        'app-blue': '#1565C0',
        'app-green': '#2E7D32',
        'app-red': '#C62828',
      }
    },
  },
  plugins: [],
}
