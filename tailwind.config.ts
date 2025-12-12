import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#273646',
          light: '#3A4F63',
          dark: '#1A2530',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C866',
          dark: '#B8941F',
        },
      },
    },
  },
  plugins: [],
}
export default config

