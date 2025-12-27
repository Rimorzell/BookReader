import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppSettings, ReaderSettings, Theme, CustomTheme } from '../types';
import { defaultAppSettings, defaultReaderSettings } from '../types';

interface SettingsState {
  settings: AppSettings;

  // Reader settings
  setTheme: (theme: Theme) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setLetterSpacing: (letterSpacing: number) => void;
  setTextAlign: (textAlign: 'left' | 'justify') => void;
  setMargins: (horizontal: number, vertical: number) => void;
  setMaxWidth: (maxWidth: number) => void;
  setParagraphSpacing: (spacing: number) => void;
  setPageAnimation: (animation: 'slide' | 'fade' | 'none') => void;
  setViewMode: (mode: 'paginated' | 'scroll') => void;
  setShowProgress: (show: boolean) => void;
  setTwoPageSpread: (enabled: boolean) => void;
  updateReaderSettings: (updates: Partial<ReaderSettings>) => void;

  // Library settings
  setLibrarySortBy: (sortBy: AppSettings['library']['sortBy']) => void;
  setLibrarySortOrder: (order: 'asc' | 'desc') => void;
  setLibraryViewMode: (mode: 'grid' | 'list') => void;

  // Custom themes
  addCustomTheme: (theme: Omit<CustomTheme, 'id'>) => void;
  updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;

  // General
  setStartupBehavior: (behavior: 'library' | 'lastBook') => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultAppSettings,

      // Reader settings
      setTheme: (theme) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, theme },
          },
        }));
        // Update document theme attribute
        document.documentElement.setAttribute('data-theme', theme);
      },

      setFontFamily: (fontFamily) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, fontFamily },
          },
        }));
      },

      setFontSize: (fontSize) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, fontSize },
          },
        }));
      },

      setLineHeight: (lineHeight) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, lineHeight },
          },
        }));
      },

      setLetterSpacing: (letterSpacing) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, letterSpacing },
          },
        }));
      },

      setTextAlign: (textAlign) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, textAlign },
          },
        }));
      },

      setMargins: (marginHorizontal, marginVertical) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, marginHorizontal, marginVertical },
          },
        }));
      },

      setMaxWidth: (maxWidth) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, maxWidth },
          },
        }));
      },

      setParagraphSpacing: (paragraphSpacing) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, paragraphSpacing },
          },
        }));
      },

      setPageAnimation: (pageAnimation) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, pageAnimation },
          },
        }));
      },

      setViewMode: (viewMode) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, viewMode },
          },
        }));
      },

      setShowProgress: (showProgress) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, showProgress },
          },
        }));
      },

      setTwoPageSpread: (twoPageSpread) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, twoPageSpread },
          },
        }));
      },

      updateReaderSettings: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, ...updates },
          },
        }));
      },

      // Library settings
      setLibrarySortBy: (sortBy) => {
        set((state) => ({
          settings: {
            ...state.settings,
            library: { ...state.settings.library, sortBy },
          },
        }));
      },

      setLibrarySortOrder: (sortOrder) => {
        set((state) => ({
          settings: {
            ...state.settings,
            library: { ...state.settings.library, sortOrder },
          },
        }));
      },

      setLibraryViewMode: (viewMode) => {
        set((state) => ({
          settings: {
            ...state.settings,
            library: { ...state.settings.library, viewMode },
          },
        }));
      },

      // Custom themes
      addCustomTheme: (theme) => {
        const id = `custom-${uuidv4()}`;
        set((state) => ({
          settings: {
            ...state.settings,
            customThemes: [...state.settings.customThemes, { ...theme, id }],
          },
        }));
      },

      updateCustomTheme: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customThemes: state.settings.customThemes.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        }));
      },

      deleteCustomTheme: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customThemes: state.settings.customThemes.filter((t) => t.id !== id),
          },
        }));
      },

      // General
      setStartupBehavior: (startupBehavior) => {
        set((state) => ({
          settings: { ...state.settings, startupBehavior },
        }));
      },

      resetToDefaults: () => {
        set({ settings: defaultAppSettings });
        document.documentElement.setAttribute('data-theme', defaultReaderSettings.theme);
      },
    }),
    {
      name: 'bookreader-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.settings.reader.theme) {
          document.documentElement.setAttribute('data-theme', state.settings.reader.theme);
        }
      },
    }
  )
);
