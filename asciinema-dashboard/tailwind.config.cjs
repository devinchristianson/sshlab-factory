/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["index.html", "./src/frontend/**/*"],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}

