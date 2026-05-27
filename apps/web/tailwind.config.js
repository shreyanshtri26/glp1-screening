/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FFF6DE',
          teal: '#8BDFDD',
          coral: '#F48F68',
          gold: '#FFE394',
        },
      },
    },
  },
  plugins: [],
};
