/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#473472',
        secondary: '#53629E',
        accent: '#87BAC3',
        bg: '#D6F4ED',
      },
    },
  },
  plugins: [],
}


