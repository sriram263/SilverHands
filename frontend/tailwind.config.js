/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. Primary Medical Brand Palette
        'med-blue': {
          primary: '#3F9BE8',
          dark: '#1F6FB2',
          deep: '#155A8A',
          light: '#EAF5FC',
          ultralight: '#F4FAFE',
          DEFAULT: '#3F9BE8',
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#D2EBFA',
          300: '#A4D5F5',
          400: '#6CBDF0',
          500: '#3F9BE8',
          600: '#1F6FB2',
          700: '#155A8A',
          800: '#163A5F',
          900: '#0F2742',
        },
        medblue: {
          primary: '#3F9BE8',
          dark: '#1F6FB2',
          deep: '#155A8A',
          light: '#EAF5FC',
          ultralight: '#F4FAFE',
          DEFAULT: '#3F9BE8',
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#D2EBFA',
          300: '#A4D5F5',
          400: '#6CBDF0',
          500: '#3F9BE8',
          600: '#1F6FB2',
          700: '#155A8A',
          800: '#163A5F',
          900: '#0F2742',
        },
        // 2. Neutral & Background Palette
        'med-bg': {
          DEFAULT: '#FFFFFF',
          light: '#F5F9FC',
          blue: '#EAF5FC',
        },
        medbg: {
          DEFAULT: '#FFFFFF',
          light: '#F5F9FC',
          blue: '#EAF5FC',
        },
        // 3. Typography & Content Palette
        'med-text': {
          heading: '#163A5F',
          primary: '#1F2937',
          secondary: '#64748B',
          light: '#94A3B8',
          senior: '#0F172A',
        },
        medtext: {
          heading: '#163A5F',
          primary: '#1F2937',
          secondary: '#64748B',
          light: '#94A3B8',
          senior: '#0F172A',
        },
        // 4. Border & Structural Divider Palette
        'med-border': {
          DEFAULT: '#DCEAF4',
          light: '#E8F1F7',
        },
        medborder: {
          DEFAULT: '#DCEAF4',
          light: '#E8F1F7',
        },
        // 5. Status & Feedback Palette
        'med-status': {
          success: '#22A06B',
          warning: '#F59E0B',
          error: '#DC3545',
        },
        medstatus: {
          success: '#22A06B',
          warning: '#F59E0B',
          error: '#DC3545',
        },
        // Backward-compatible token mappings ensuring entire UI harmonizes into Medical Blue & Healthcare Palette
        saffron: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#D2EBFA',
          300: '#A4D5F5',
          400: '#6CBDF0',
          500: '#3F9BE8', // Primary Brand Medical Blue
          600: '#1F6FB2', // Dark Blue
          700: '#155A8A', // Deep Blue
          DEFAULT: '#3F9BE8',
          light: '#6CBDF0',
          dark: '#1F6FB2',
        },
        sage: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22A06B', // Medical Status Success
          600: '#16A34A',
          700: '#15803D',
          DEFAULT: '#22A06B',
          light: '#4ADE80',
          dark: '#15803D',
        },
        ivory: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#F5F9FC',
        },
        cream: {
          50: '#FFFFFF',
          100: '#F5F9FC',
          200: '#EAF5FC',
          300: '#DCEAF4',
          DEFAULT: '#F5F9FC',
        },
        warmgray: {
          50: '#F5F9FC',
          100: '#E8F1F7',
          200: '#DCEAF4',
          300: '#CBD5E1',
          400: '#94A3B8', // med-text.light
          500: '#64748B', // med-text.secondary
          600: '#475569',
          700: '#334155',
          800: '#1F2937', // med-text.primary
          900: '#163A5F', // med-text.heading
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -1px rgba(31, 111, 178, 0.08)',
        'warm': '0 4px 20px -2px rgba(31, 111, 178, 0.12)',
        'warm-lg': '0 10px 30px -4px rgba(31, 111, 178, 0.16)',
        'warm-xl': '0 20px 40px -6px rgba(31, 111, 178, 0.20)',
        'warm-2xl': '0 25px 50px -12px rgba(31, 111, 178, 0.25)',
        'med-sm': '0 2px 8px -1px rgba(31, 111, 178, 0.08)',
        'med-md': '0 4px 20px -2px rgba(31, 111, 178, 0.12)',
        'med-lg': '0 10px 30px -4px rgba(31, 111, 178, 0.16)',
        'med-glow': '0 4px 14px 0 rgba(63, 155, 232, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
