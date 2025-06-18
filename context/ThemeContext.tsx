import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const themes = {
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0d0d0d',
      card: '#1c1c1e',
      text: '#ffffff',
      border: '#2c2c2e',
      subtitle: '#a1a1a1',
    },
  },
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      card: '#f2f2f2',
      text: '#000000',
      border: '#cccccc',
      subtitle: '#666666',
    },
  },
};
