/**
 * Design Tokens - Semantic Color System
 *
 * This file defines the semantic color tokens for DB-GPT.
 * All colors are defined as raw hex values and mapped to both
 * Ant Design and Tailwind CSS.
 */

export const primitiveColors = {
  // Primary brand colors
  primary: {
    50: '#e6f0ff',
    100: '#b3d4ff',
    200: '#80b8ff',
    300: '#4d9cff',
    400: '#1a80ff',
    500: '#0069fe', // Main primary
    600: '#0054cc',
    700: '#003f99',
    800: '#002a66',
    900: '#001533',
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic colors
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  info: '#0069fe',
};

/**
 * Semantic color tokens
 * Use these for all UI components instead of hardcoding colors
 */
export const semanticColors = {
  // Surface colors (backgrounds)
  surface: {
    base: '#f7f7f7',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.45)',
    subtle: '#f3f4f6',
    // Dark mode
    dark: {
      base: '#151622',
      elevated: '#232734',
      container: '#2a2d3a',
      subtle: '#1f2937',
    },
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
    link: '#0069fe',
    // Dark mode
    dark: {
      primary: '#f7f7f7',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      disabled: '#6b7280',
    },
  },

  // Border colors
  border: {
    default: '#e5e7eb',
    strong: '#d1d5db',
    subtle: '#f3f4f6',
    focused: '#0069fe',
    // Dark mode
    dark: {
      default: '#374151',
      strong: '#4b5563',
      subtle: '#1f2937',
    },
  },

  // Accent colors
  accent: {
    primary: '#0069fe',
    hover: '#0054cc',
    active: '#003f99',
    subtle: '#e6f0ff',
  },

  // Status colors
  status: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: '#0069fe',
    processing: '#0069fe',
    successBg: '#f6ffed',
    warningBg: '#fffbe6',
    errorBg: '#fff2f0',
    infoBg: '#e6f0ff',
  },
};

/**
 * Ant Design Theme Tokens
 * Used for ConfigProvider theme prop
 */
export const antdTokens = {
  light: {
    colorPrimary: semanticColors.accent.primary,
    colorSuccess: semanticColors.status.success,
    colorWarning: semanticColors.status.warning,
    colorError: semanticColors.status.error,
    colorInfo: semanticColors.status.info,
    colorBgBase: semanticColors.surface.base,
    colorBgContainer: semanticColors.surface.elevated,
    colorBgElevated: semanticColors.surface.elevated,
    colorBorder: semanticColors.border.default,
    colorBorderSecondary: semanticColors.border.subtle,
    colorText: semanticColors.text.primary,
    colorTextSecondary: semanticColors.text.secondary,
    colorTextTertiary: semanticColors.text.tertiary,
    borderRadius: 4,
    borderRadiusSM: 2,
    borderRadiusLG: 8,
    borderRadiusXL: 12,
  },
  dark: {
    colorPrimary: semanticColors.accent.primary,
    colorSuccess: semanticColors.status.success,
    colorWarning: semanticColors.status.warning,
    colorError: semanticColors.status.error,
    colorInfo: semanticColors.status.info,
    colorBgBase: semanticColors.surface.dark.base,
    colorBgContainer: semanticColors.surface.dark.elevated,
    colorBgElevated: semanticColors.surface.dark.elevated,
    colorBorder: semanticColors.border.dark.default,
    colorBorderSecondary: semanticColors.border.dark.subtle,
    colorText: semanticColors.text.dark.primary,
    colorTextSecondary: semanticColors.text.dark.secondary,
    colorTextTertiary: semanticColors.text.dark.tertiary,
    borderRadius: 4,
    borderRadiusSM: 2,
    borderRadiusLG: 8,
    borderRadiusXL: 12,
  },
};

/**
 * Spacing tokens (in px)
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

/**
 * Font size tokens (in px)
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

/**
 * Shadow tokens
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

/**
 * Border radius tokens
 */
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

/**
 * Transition tokens
 */
export const transitions = {
  fast: '150ms ease-in-out',
  DEFAULT: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

/**
 * Z-index tokens
 */
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
  // Floating buttons (from globals.css)
  floatHelper: 997,
  promptBot: 998,
  scrollButtons: 999,
};
