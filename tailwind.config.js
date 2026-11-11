/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
      colors: {
        leaf: { 50: '#ecfdf3', 100: '#d1fadf', 400: '#3ccb7f', 500: '#16a34a', 600: '#15803d', 700: '#166534' },
        sun: { 400: '#facc15', 500: '#eab308' },
        berry: { 400: '#f87171', 500: '#ef4444' },
        sky2: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        ink: { 900: '#1f2937', 600: '#4b5563', 400: '#9ca3af' },
      },
      boxShadow: { btn: '0 4px 0 0 rgba(0,0,0,0.18)', card: '0 2px 0 0 #e5e7eb' },
    },
  },
  plugins: [],
};
