/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Instrument Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f7f8f9',
          100: '#eceef1',
          200: '#d5d9e0',
          300: '#b0b7c4',
          400: '#858fa2',
          500: '#667085',
          600: '#4b5565',
          700: '#384152',
          800: '#252f3f',
          900: '#1a2234',
          950: '#0f141f',
        },
        accent: {
          DEFAULT: '#2563eb',
          muted: '#93c5fd',
        },
      },
    },
  },
  plugins: [],
}
