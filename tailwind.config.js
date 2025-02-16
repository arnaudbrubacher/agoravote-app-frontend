const animate = require("tailwindcss-animate")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode support
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.{vue,js}',
    './pages/**/*.{vue,js}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a', // Dark background color
        'background-light': '#ffffff', // Light background color
        'text-primary': '#ffffff', // Primary text color for dark mode
        'text-muted': '#a1a1a1', // Muted text color for dark mode
        'button-default': '#ffffff', // Default button color for dark mode
        'button-hover': '#e5e5e5', // Hover button color for dark mode
      },
    },
  },
  plugins: [animate],
}