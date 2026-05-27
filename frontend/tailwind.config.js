/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        moss: {
          DEFAULT: "#39d353",
          hover: "#2ea043",
          subtle: "#0d2818",
        },
      },
    },
  },
  plugins: [],
};
