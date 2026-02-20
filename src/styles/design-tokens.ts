/**
 * Design tokens - Dark tech minimalista
 * Paleta escura com acentos cyan/blue
 */

export const colors = {
  // Base
  background: {
    primary: "hsl(222, 47%, 4%)",
    secondary: "hsl(222, 47%, 8%)",
    tertiary: "hsl(222, 47%, 12%)",
    elevated: "hsl(222, 30%, 10%)",
  },
  surface: {
    default: "hsl(222, 20%, 6%)",
    muted: "hsla(0, 0%, 100%, 0.05)",
    border: "hsla(0, 0%, 100%, 0.08)",
  },
  // Acentos
  accent: {
    primary: "hsl(189, 94%, 43%)",
    secondary: "hsl(221, 83%, 53%)",
    muted: "hsla(189, 94%, 43%, 0.2)",
    glow: "hsla(189, 94%, 43%, 0.25)",
  },
  // Texto
  text: {
    primary: "hsl(0, 0%, 100%)",
    secondary: "hsl(215, 20%, 65%)",
    muted: "hsl(215, 16%, 47%)",
    inverse: "hsl(222, 47%, 4%)",
  },
  // Status
  status: {
    success: "hsl(142, 71%, 45%)",
    error: "hsl(0, 72%, 51%)",
    warning: "hsl(38, 92%, 50%)",
    info: "hsl(189, 94%, 43%)",
  },
} as const;

export const spacing = {
  0: "0",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  4: "1rem",        // 16px
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  8: "2rem",        // 32px
  10: "2.5rem",     // 40px
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px
  20: "5rem",       // 80px
} as const;

export const radius = {
  none: "0",
  sm: "0.375rem",   // 6px
  md: "0.5rem",     // 8px
  lg: "0.75rem",    // 12px
  xl: "1rem",       // 16px
  "2xl": "1.25rem", // 20px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const;

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.2)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.4)",
  glow: "0 0 40px -10px hsla(189, 94%, 43%, 0.25)",
  "glow-accent": "0 0 20px -5px hsla(189, 94%, 43%, 0.35)",
} as const;
