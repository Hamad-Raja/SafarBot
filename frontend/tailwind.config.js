/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#29b6c8",
          dark: "#0091a8",
          light: "#5ad8ea",
        },
      },
      fontFamily: {
        display: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
