import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1A56A0",
          light: "#D6E4F7",
          accent: "#0EA5E9",
        },
        theme: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          'card-hover': 'var(--card-hover)',
          border: 'var(--border)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          subtle: 'var(--subtle)',
        }
      },
    },
  },
  plugins: [],
};

export default config;