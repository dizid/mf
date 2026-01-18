import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Mobile-first: 375px base
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
      },
      // High contrast colors for outdoor visibility
      colors: {
        primary: {
          DEFAULT: '#1a56db',
          dark: '#1e429f',
        },
        success: '#047857',
        warning: '#d97706',
        danger: '#dc2626',
        surface: {
          DEFAULT: '#ffffff',
          dark: '#f3f4f6',
        }
      },
      // Large touch targets
      spacing: {
        'touch': '56px', // Minimum touch target
        'input': '48px', // Input height
        'row': '64px',   // List row height
      },
      fontSize: {
        // Minimum readable sizes
        'body': ['16px', '24px'],
        'label': ['14px', '20px'],
        'heading': ['24px', '32px'],
      },
    },
  },
  plugins: [],
}

export default config
