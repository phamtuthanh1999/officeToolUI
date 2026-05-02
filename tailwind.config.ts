import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff7a18",
          light: "#ff9a4d",
          dark: "#e06510",
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#ff7a18",
          600: "#e06510",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07),0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
