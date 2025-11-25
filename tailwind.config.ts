import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Seahawks Primary Navy (College Navy)
        navy: {
          DEFAULT: '#002244',
          50: '#e6edf5',
          100: '#ccdaeb',
          200: '#99b5d6',
          300: '#6690c2',
          400: '#336bad',
          500: '#004488',
          600: '#003366',
          700: '#002244',
          800: '#001a33',
          900: '#001122',
        },
        // Seahawks Action Green
        action: {
          DEFAULT: '#69BE28',
          50: '#f0fbe8',
          100: '#dcf7c8',
          200: '#b9ef91',
          300: '#96e75a',
          400: '#7ed432',
          500: '#69BE28',
          600: '#5aa522',
          700: '#4a8c1c',
          800: '#3b7316',
          900: '#2c5a10',
        },
        // Seahawks Wolf Grey
        wolf: {
          DEFAULT: '#A5ACAF',
          50: '#f8f9f9',
          100: '#f1f2f3',
          200: '#e3e5e7',
          300: '#d5d8db',
          400: '#c7cbcf',
          500: '#A5ACAF',
          600: '#8a9194',
          700: '#6f7679',
          800: '#545b5e',
          900: '#393f43',
        },
      },
    },
  },
  plugins: [],
};
export default config;
