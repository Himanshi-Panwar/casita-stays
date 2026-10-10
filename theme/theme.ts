import { createTheme } from '@mui/material/styles';

/** Brand tokens. Contrast ratios against `background` / `paper` are all ≥ 4.5:1 (WCAG AA). */
export const brand = {
  pine: '#1F4D45',
  pineDark: '#143630',
  pineLight: '#3B7468',
  terracotta: '#B4491F',
  sand: '#FAF6EF',
  sandDark: '#F1E9DB',
  ink: '#1C2622',
  inkMuted: '#55605B',
  line: '#E6DED0',
} as const;

const display = 'var(--font-display), Georgia, serif';
const body = 'var(--font-body), system-ui, -apple-system, "Segoe UI", sans-serif';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: brand.pine,
      light: brand.pineLight,
      dark: brand.pineDark,
      contrastText: '#fff',
    },
    secondary: { main: brand.terracotta, contrastText: '#fff' },
    background: { default: brand.sand, paper: '#ffffff' },
    text: { primary: brand.ink, secondary: brand.inkMuted },
    divider: brand.line,
    error: { main: '#B3261E' },
    success: { main: '#2E6B3A' },
  },
  shape: { borderRadius: 14 },
  spacing: 8,
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  typography: {
    fontFamily: body,
    h1: {
      fontFamily: display,
      fontWeight: 600,
      fontSize: 'clamp(2rem, 1.4rem + 2.6vw, 3.5rem)',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: display,
      fontWeight: 600,
      fontSize: 'clamp(1.6rem, 1.3rem + 1.3vw, 2.25rem)',
      lineHeight: 1.15,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: display,
      fontWeight: 600,
      fontSize: 'clamp(1.35rem, 1.15rem + 0.8vw, 1.75rem)',
      lineHeight: 1.2,
    },
    h4: { fontFamily: display, fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.25 },
    h5: { fontFamily: display, fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontFamily: body, fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.6 },
    overline: { fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased' },
        // One consistent, high-contrast focus ring for every interactive element.
        ':focus-visible': {
          outline: `3px solid ${brand.terracotta}`,
          outlineOffset: '2px',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 22,
          minHeight: 44,
          '&.MuiButton-colorPrimary.MuiButton-contained:hover': { backgroundColor: brand.pineDark },
        },
        sizeLarge: { minHeight: 52, paddingInline: 30, fontSize: '1rem' },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CFC5B3' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.pineLight },
          '&.Mui-focused': { boxShadow: `0 0 0 4px ${brand.pine}26` },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.pine,
            borderWidth: 2,
          },
          '&.Mui-error.Mui-focused': { boxShadow: '0 0 0 4px #B3261E26' },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { '&.Mui-focused': { color: brand.pine } } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${brand.line}`, borderRadius: 18, backgroundImage: 'none' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiPaginationItem: {
      styleOverrides: {
        root: { fontWeight: 600, '&.Mui-selected': { backgroundColor: brand.pine, color: '#fff' } },
      },
    },
  },
});
