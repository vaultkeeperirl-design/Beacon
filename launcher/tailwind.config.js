module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beacon: {
          orange: '#FF7F00',
          dark: '#1a1a1a',
          darker: '#121212',
          card: '#242424'
        }
      }
    },
  },
  plugins: [],
}
