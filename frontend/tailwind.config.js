/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05060a",
        panel: "#0b0d16",
        edge: "#1c2033",
        accent: "#7dd3fc",
        accent2: "#c4b5fd",
        ember: "#fb923c",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(125,211,252,0.12), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(125,211,252,0.25)",
        card: "0 8px 32px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
