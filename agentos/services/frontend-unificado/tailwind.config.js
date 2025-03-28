module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        stripeBlue: '#0a2540',
        stripePurple: '#635bff',
        gitkrakenBg: '#1f1f1f',
        gitGreen: '#27ff9f',
        notionGray: '#f7f7f7',
        superGray: '#f4f4f4'
      },
      fontFamily: {
        notion: ['Inter', 'sans-serif'],
        stripe: ['Helvetica Neue', 'sans-serif'],
        super: ['system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}