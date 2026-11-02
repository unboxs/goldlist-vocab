/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#fcfbf7',
          100: '#f7f4ea',
          200: '#ede8d5',
          300: '#ded5b7',
          800: '#2c2824',
          900: '#1e1b18',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        bronze: {
          500: '#cd7f32',
          600: '#b86d26',
        },
        silver: {
          400: '#94a3b8',
          500: '#64748b',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        handwriting: ['"Caveat"', '"Kalam"', 'cursive'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'notebook': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'notebook-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
