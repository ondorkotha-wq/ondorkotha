module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        avenir: ["var(--font-poppins)", "sans-serif"],
        times: ['"Times New Roman"', "serif"],
        // body: ["var(--font-bodoni)"],
        heading: ["var(--font-cinzel)"],
      },
    },
  },
  plugins: [],
};
