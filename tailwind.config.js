const PRIMARY_COLOR_PALETTE = {
  50: '#E7F0FE',
  100: '#B4D0FD',
  200: '#90BAFC',
  300: '#5D9AFB',
  400: '#3D86FA',
  500: '#0D68F9',
  600: '#0C5FE3',
  700: '#094AB1',
  800: '#073989',
  900: '#052C69',
}

const SECONDARY_COLOR_PALETTE = {
  50: '#FFFEFE',
  100: '#FFFBFB',
  200: '#FFF9F9',
  300: '#FFF6F6',
  400: '#FFF4F4',
  500: '#FFF1F1',
  600: '#E8DBDB',
  700: '#B5ABAB',
  800: '#8C8585',
  900: '#6B6565',
}

const BACKGROUND_COLOR_PALETTE = {
  50: '#FEFEFE',
  100: '#FCFCFC',
  200: '#FAFAFA',
  300: '#F8F8F8',
  400: '#F6F6F6',
  500: '#F4F4F4',
  600: '#DCDCDC',
  700: '#A9A9A9',
  800: '#858585',
  900: '#6C6C6C',
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: PRIMARY_COLOR_PALETTE,
        secondary: SECONDARY_COLOR_PALETTE,
        background: BACKGROUND_COLOR_PALETTE,
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '768px',
          xl: '768px',
          '2xl': '1024px',
          '3xl': '1100px',
        },
      },
    },
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  daisyui: {
    themes: ['light', 'dark'], // Define light and dark themes
  },
}
