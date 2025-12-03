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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Seattle Seahawks colors
        navy: {
          DEFAULT: '#002244',
          50: '#e6eef5',
          100: '#b3c9db',
          200: '#80a4c1',
          300: '#4d7fa7',
          400: '#1a5a8d',
          500: '#002244',
          600: '#001b36',
          700: '#001428',
          800: '#000d1a',
          900: '#00060c',
        },
        action: {
          DEFAULT: '#69BE28',
          50: '#f0f9e8',
          100: '#d4efc0',
          200: '#b8e598',
          300: '#9cdb70',
          400: '#80d148',
          500: '#69BE28',
          600: '#549820',
          700: '#3f7218',
          800: '#2a4c10',
          900: '#152608',
        },
        grey: {
          DEFAULT: '#A5ACAF',
          50: '#f5f6f6',
          100: '#e6e8e9',
          200: '#d7dadb',
          300: '#c8ccce',
          400: '#b9bec0',
          500: '#A5ACAF',
          600: '#848a8c',
          700: '#636769',
          800: '#424546',
          900: '#212223',
        },
      },
    },
  },
  plugins: [],
};
export default config;
