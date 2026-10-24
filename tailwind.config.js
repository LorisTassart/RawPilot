/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          bg: 'rgb(var(--c-bg) / <alpha-value>)',
          surface: 'rgb(var(--c-surface) / <alpha-value>)',
          surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
          border: 'rgb(var(--c-border) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          dim: 'rgb(var(--c-accent-dim) / <alpha-value>)',
        },
        status: {
          todo: 'rgb(var(--c-todo) / <alpha-value>)',
          progress: 'rgb(var(--c-progress) / <alpha-value>)',
          done: 'rgb(var(--c-done) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          dim: 'rgb(var(--c-ink-dim) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
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
