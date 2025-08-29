import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette to match your presentation's aesthetic
        'brand-primary': '#1D4ED8', // A strong blue
        'brand-secondary': '#3B82F6', // A lighter blue for highlights
        'brand-light': '#EFF6FF', // A very light blue for backgrounds
        'brand-dark': '#1E3A8A', // A dark blue for text and accents
      },
      keyframes: {
        // A subtle pulse animation for the processing status
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
