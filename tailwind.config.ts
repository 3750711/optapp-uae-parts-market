
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#f6f7fa',
        foreground: '#181920',
        primary: {
          DEFAULT: '#181c25',
        },
        secondary: {
          DEFAULT: '#424b5a',
        },
        card: {
          DEFAULT: '#fff'
        },
        accentBlue: "#4c51bf", // заменено с #2269f1 на индиго оттенок
        yellowAccent: "#FFE158",
        lightGray: "#f6f7fa",
        cardBg: "#fff",
        link: "#4c51bf", // тоже индиго замена для ссылок
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(34, 41, 47, 0.09)",
      },
      borderRadius: {
        lg: '1rem',
        md: '12px',
        '2xl': '2rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
