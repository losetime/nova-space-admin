/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        'primary-dark': '#177ddc',
      },
    },
  },
  plugins: [],
  // Avoid conflicts with Ant Design
  corePlugins: {
    preflight: false,
  },
}