/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0e1013',
          surface: '#161a1f',
          surface2: '#1d2229',
          border: '#272d36',
        },
        accent: {
          DEFAULT: '#5b8def',
          dim: '#3d5f9e',
        },
        status: {
          todo: '#e6584f',
          progress: '#e8a33d',
          done: '#4cae6d',
        },
        ink: {
          DEFAULT: '#e8e6e1',
          dim: '#9aa0a8',
          faint: '#5c636d',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
