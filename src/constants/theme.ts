// Theme color definitions - single source of truth
// These values are synced with CSS variables in src/styles/index.css

export interface ThemeColors {
  background: string;
  text: string;
  link: string;
}

export const THEME_COLORS: Record<string, ThemeColors> = {
  light: {
    background: '#ffffff',
    text: '#1d1d1f',
    link: '#007aff',
  },
  sepia: {
    background: '#f8f3e8',
    text: '#433422',
    link: '#b5651d',
  },
  dark: {
    background: '#1c1c1e',
    text: '#f5f5f7',
    link: '#0a84ff',
  },
  black: {
    background: '#000000',
    text: '#ffffff',
    link: '#0a84ff',
  },
};

export function getThemeColors(theme: string): ThemeColors {
  return THEME_COLORS[theme] || THEME_COLORS.light;
}

// UI Constants
export const UI_CONSTANTS = {
  // Timing
  UI_HIDE_TIMEOUT_MS: 3000,
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 4000,

  // Font sizes
  MIN_FONT_SIZE: 12,
  MAX_FONT_SIZE: 32,
  DEFAULT_FONT_SIZE: 18,

  // Click zones (as fractions of width)
  CLICK_ZONE_PREV: 1/3,
  CLICK_ZONE_NEXT: 2/3,

  // Progress bar
  PROGRESS_STEP: 2, // Percentage step for keyboard navigation

  // Library
  BOOK_CARD_MIN_WIDTH: 160,

  // Context menu
  CONTEXT_MENU_WIDTH: 180,
  CONTEXT_MENU_HEIGHT: 180,
  CONTEXT_MENU_MARGIN: 10,
} as const;
