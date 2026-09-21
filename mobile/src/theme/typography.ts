import type { TextStyle } from 'react-native';

// System font, but with a consistent weight/size scale so text hierarchy
// reads the same across every screen.
export const typography = {
  brand: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
  } as TextStyle,
  title: {
    fontSize: 24,
    fontWeight: '700',
  } as TextStyle,
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
  small: {
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,
  smallMedium: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  price: {
    fontSize: 22,
    fontWeight: '800',
  } as TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
