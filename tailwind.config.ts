import type { Config } from 'tailwindcss'

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'theme-white': '#CECECE',
        'theme-dark': '#1B1D1F',
        'theme-yellow': '#E7BD7B'
      }
    },
  },
  plugins: [],
} satisfies Config

