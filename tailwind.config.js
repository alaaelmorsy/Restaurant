/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./src/renderer/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        danger: '#dc2626',
        success: '#16a34a',
      },
      fontFamily: {
        arabic: ['Cairo', 'saudi_riyal', 'system-ui', 'Noto Kufi Arabic', 'Arial', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
