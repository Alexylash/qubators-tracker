import type { Config } from 'tailwindcss';
import tokens from './design/tokens.json';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.primary,
        hot: tokens.colors.hot,
        accent: tokens.colors.accent,
        wa: tokens.colors.whatsapp,
        ink: tokens.colors.text,
        mist: tokens.colors.bg_app
      },
      borderRadius: { card: '16px' },
      boxShadow: { hard: '3px 3px 0 #0A0A0A' }
    }
  },
  plugins: []
};
export default config;
