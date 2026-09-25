/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <-- TAMBAHKAN BARIS INI
  theme: {
    extend: {},
  },
  plugins: [],
}