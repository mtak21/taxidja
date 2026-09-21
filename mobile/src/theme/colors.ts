export const colors = {
  primary: '#D97D3D',
  primaryDark: '#B8632A',
  primaryLight: '#F0C9A8',

  secondary: '#4A7856',
  secondaryDark: '#385C42',

  danger: '#C0392B',
  dangerLight: '#F5D5D0',

  dark: '#1A2E44',

  background: '#FAF7F2',
  surface: '#FFFFFF',

  text: '#1A2E44',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',

  border: '#E5DED3',
  disabled: '#D8D2C7',

  warning: '#C98A1F',
  warningLight: '#F6E3C2',
} as const;

export type ColorToken = keyof typeof colors;
