import { createTheme } from '@mui/material/styles';

// Centralized color variables
export const COLORS = {
  PRIMARY: '#2C4E80',
  PRIMARY_LIGHT: '#4A6B9A',
  PRIMARY_DARK: '#1E3A5A',
  SECONDARY: '#15F5BA',
  SECONDARY_LIGHT: '#4DF7C7',
  SECONDARY_DARK: '#0ED4A3',
  ALERT: '#FC4100',
  ALERT_LIGHT: '#FD6B33',
  ALERT_DARK: '#E03A00',
};

// Create theme with centralized primary color
export const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.PRIMARY,
      light: COLORS.PRIMARY_LIGHT,
      dark: COLORS.PRIMARY_DARK,
    },
    secondary: {
      main: COLORS.SECONDARY,
      light: COLORS.SECONDARY_LIGHT,
      dark: COLORS.SECONDARY_DARK,
    },
    error: {
      main: COLORS.ALERT,
      light: COLORS.ALERT_LIGHT,
      dark: COLORS.ALERT_DARK,
    },
  },
}); 