
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
        background: '#f9fafb',
        foreground: '#111827',
        primary: {
          DEFAULT: '#6366f1', // Индиго основной
          foreground: '#ffffff',
          hover: '#4f46e5',
          focus: '#4338ca',
        },
        secondary: {
          DEFAULT: '#f59e0b', // Желтый акцент
          foreground: '#ffffff',
          hover: '#d97706',
          focus: '#b45309',
        },
        card: {
          DEFAULT: '#fff',
          shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        accent: {
          DEFAULT: '#eff6ff', // Голубой акцент (светлый)
          foreground: '#3b82f6',
        },
        destructive: {
          DEFAULT: '#ef4444', // Красный
          foreground: '#ffffff',
        },
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(34, 41, 47, 0.09)",
        elevation: "0 6px 24px -8px rgba(0, 0, 0, 0.2)",
        "elevation-hover": "0 12px 32px -10px rgba(0, 0, 0, 0.3)",
        "button": "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
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
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s infinite ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
