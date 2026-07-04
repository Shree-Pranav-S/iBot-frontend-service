/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        base: 'var(--bg-base)',
        elevated: 'var(--bg-elevated)',
        'elevated-2': 'var(--bg-elevated-2)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        brand: {
          accent: 'var(--brand-accent)',
          hover: 'var(--brand-hover)',
          charcoal: 'var(--brand-charcoal)',
          soft: 'var(--brand-soft)',
        },
        emerald: {
          50: 'var(--emerald-50)',
          400: 'var(--emerald-400)',
          500: 'var(--emerald-500)',
          600: 'var(--emerald-600)',
          700: 'var(--emerald-700)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          alt: 'var(--sidebar-bg-alt)',
          deep: 'var(--sidebar-bg-deep)',
        },
      },
      borderColor: {
        default: 'var(--border-default)',
        subtle: 'var(--border-subtle)',
        emphasis: 'var(--border-emphasis)',
      },
      borderRadius: {
        'input-btn': 'var(--radius-input-btn)',
        'card': 'var(--radius-card)',
        'modal': 'var(--radius-modal)',
      },
      boxShadow: {
        'glow-emerald': 'var(--shadow-glow-emerald)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      }
    },
  },
  plugins: [],
};
