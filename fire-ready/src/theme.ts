"use client";

import { createTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { FONT_FALLBACK, tokens } from "@/lib/tokens";

export const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: tokens.contentMaxWidth, xl: 1536 },
  },
  palette: {
    mode: "light",
    background: { default: tokens.background, paper: tokens.surface },
    primary: { main: tokens.primary, contrastText: "#FFFFFF" },
    secondary: { main: tokens.accentStrong, contrastText: "#FFFFFF" },
    text: { primary: tokens.text, secondary: tokens.muted },
    divider: tokens.border,
  },
  shape: { borderRadius: tokens.radius },
  typography: {
    fontFamily: ["var(--font-noto-sans-jp)", ...FONT_FALLBACK].join(", "),
    h1: {
      fontSize: "clamp(2rem, 1.25rem + 2vw, 3rem)",
      fontWeight: 700,
      lineHeight: 1.35,
      letterSpacing: "0.02em",
    },
    h2: {
      fontSize: "clamp(1.5rem, 1.25rem + 1vw, 2.125rem)",
      fontWeight: 700,
      lineHeight: 1.45,
    },
    h3: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.5 },
    h4: { fontSize: "1.0625rem", fontWeight: 700, lineHeight: 1.6 },
    body1: { fontSize: "1rem", lineHeight: 1.8 },
    body2: { fontSize: "0.9375rem", lineHeight: 1.75 },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: "0.02em" },
  },
  components: {
    MuiButtonBase: {
      defaultProps: { LinkComponent: NextLink },
      // ButtonBase は outline: 0 のため、キーボード操作時の枠を明示する
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: `3px solid ${tokens.primary}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiLink: { defaultProps: { component: NextLink } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 999, paddingInline: 20 },
      },
    },
    MuiToggleButton: {
      styleOverrides: { root: { minHeight: 44, paddingInline: 16 } },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiInputBase: { styleOverrides: { input: { fontSize: 16 } } },
    MuiCheckbox: { styleOverrides: { root: { padding: 10 } } },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginInline: 2, fontSize: 13, lineHeight: 1.6 },
      },
    },
  },
});
