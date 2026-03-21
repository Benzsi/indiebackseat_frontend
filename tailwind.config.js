/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#27374D',
        secondary: '#526D82',
        accent: '#9DB2BF',
        bg: '#DDE6ED',
      },
    },
  },
  plugins: [],
}


