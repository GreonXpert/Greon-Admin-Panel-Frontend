// src/theme/index.js
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import typography from './typography';

const theme = createTheme({
  palette,
  typography,
  shape: {
    borderRadius: 6, // was 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 16,             // was 20
          padding: '6px 12px',          // was '8px 16px'
          fontSize: '0.7rem',           // scaled to match typography
        },
        contained: {
          boxShadow: '0px 2px 6px rgba(26, 201, 159, 0.25)', // lighter
          '&:hover': {
            boxShadow: '0px 4px 10px rgba(26, 201, 159, 0.35)', // scaled
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16, // was 20
            '& fieldset': {
              borderColor: '#e9ecef',
            },
            '&:hover fieldset': {
              borderColor: palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.07)', // smaller/lighter
          borderRadius: 10, // was 12
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.07)', // reduced
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: palette.grey[500],
          fontSize: '0.7rem', // smaller adornments
        },
      },
    },
  },
});

export default theme;
