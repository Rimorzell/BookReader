import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from './settingsStore';
import { defaultAppSettings, defaultReaderSettings } from '../types';

// Helper to reset store between tests
const resetStore = () => {
  useSettingsStore.setState({
    settings: { ...defaultAppSettings },
  });
};

describe('settingsStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    // Mock document.documentElement.setAttribute
    vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => {});
  });

  describe('Theme Settings', () => {
    it('should set theme', () => {
      const { setTheme } = useSettingsStore.getState();

      setTheme('dark');
      expect(useSettingsStore.getState().settings.reader.theme).toBe('dark');

      setTheme('sepia');
      expect(useSettingsStore.getState().settings.reader.theme).toBe('sepia');

      setTheme('black');
      expect(useSettingsStore.getState().settings.reader.theme).toBe('black');

      setTheme('light');
      expect(useSettingsStore.getState().settings.reader.theme).toBe('light');
    });

    it('should update document theme attribute when theme changes', () => {
      const { setTheme } = useSettingsStore.getState();

      setTheme('dark');

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });
  });

  describe('Font Settings', () => {
    it('should set font family', () => {
      const { setFontFamily } = useSettingsStore.getState();

      setFontFamily('Palatino Linotype, Palatino, serif');
      expect(useSettingsStore.getState().settings.reader.fontFamily).toBe('Palatino Linotype, Palatino, serif');
    });

    it('should set font size', () => {
      const { setFontSize } = useSettingsStore.getState();

      setFontSize(24);
      expect(useSettingsStore.getState().settings.reader.fontSize).toBe(24);
    });

    it('should handle font size edge cases', () => {
      const { setFontSize } = useSettingsStore.getState();

      setFontSize(8); // Very small
      expect(useSettingsStore.getState().settings.reader.fontSize).toBe(8);

      setFontSize(72); // Very large
      expect(useSettingsStore.getState().settings.reader.fontSize).toBe(72);
    });
  });

  describe('Line Height Settings', () => {
    it('should set line height', () => {
      const { setLineHeight } = useSettingsStore.getState();

      setLineHeight(2.0);
      expect(useSettingsStore.getState().settings.reader.lineHeight).toBe(2.0);
    });

    it('should handle decimal line heights', () => {
      const { setLineHeight } = useSettingsStore.getState();

      setLineHeight(1.5);
      expect(useSettingsStore.getState().settings.reader.lineHeight).toBe(1.5);

      setLineHeight(1.75);
      expect(useSettingsStore.getState().settings.reader.lineHeight).toBe(1.75);
    });
  });

  describe('Letter Spacing Settings', () => {
    it('should set letter spacing', () => {
      const { setLetterSpacing } = useSettingsStore.getState();

      setLetterSpacing(1);
      expect(useSettingsStore.getState().settings.reader.letterSpacing).toBe(1);

      setLetterSpacing(-0.5);
      expect(useSettingsStore.getState().settings.reader.letterSpacing).toBe(-0.5);
    });
  });

  describe('Text Alignment Settings', () => {
    it('should set text alignment', () => {
      const { setTextAlign } = useSettingsStore.getState();

      setTextAlign('justify');
      expect(useSettingsStore.getState().settings.reader.textAlign).toBe('justify');

      setTextAlign('left');
      expect(useSettingsStore.getState().settings.reader.textAlign).toBe('left');
    });
  });

  describe('Margin Settings', () => {
    it('should set horizontal and vertical margins', () => {
      const { setMargins } = useSettingsStore.getState();

      setMargins(80, 50);

      const { settings } = useSettingsStore.getState();
      expect(settings.reader.marginHorizontal).toBe(80);
      expect(settings.reader.marginVertical).toBe(50);
    });

    it('should handle zero margins', () => {
      const { setMargins } = useSettingsStore.getState();

      setMargins(0, 0);

      const { settings } = useSettingsStore.getState();
      expect(settings.reader.marginHorizontal).toBe(0);
      expect(settings.reader.marginVertical).toBe(0);
    });
  });

  describe('Max Width Settings', () => {
    it('should set max width', () => {
      const { setMaxWidth } = useSettingsStore.getState();

      setMaxWidth(1000);
      expect(useSettingsStore.getState().settings.reader.maxWidth).toBe(1000);
    });
  });

  describe('Paragraph Spacing Settings', () => {
    it('should set paragraph spacing', () => {
      const { setParagraphSpacing } = useSettingsStore.getState();

      setParagraphSpacing(1.5);
      expect(useSettingsStore.getState().settings.reader.paragraphSpacing).toBe(1.5);
    });
  });

  describe('Page Animation Settings', () => {
    it('should set page animation', () => {
      const { setPageAnimation } = useSettingsStore.getState();

      setPageAnimation('fade');
      expect(useSettingsStore.getState().settings.reader.pageAnimation).toBe('fade');

      setPageAnimation('none');
      expect(useSettingsStore.getState().settings.reader.pageAnimation).toBe('none');

      setPageAnimation('slide');
      expect(useSettingsStore.getState().settings.reader.pageAnimation).toBe('slide');
    });
  });

  describe('View Mode Settings', () => {
    it('should set view mode', () => {
      const { setViewMode } = useSettingsStore.getState();

      setViewMode('scroll');
      expect(useSettingsStore.getState().settings.reader.viewMode).toBe('scroll');

      setViewMode('paginated');
      expect(useSettingsStore.getState().settings.reader.viewMode).toBe('paginated');
    });
  });

  describe('Show Progress Settings', () => {
    it('should set show progress', () => {
      const { setShowProgress } = useSettingsStore.getState();

      setShowProgress(false);
      expect(useSettingsStore.getState().settings.reader.showProgress).toBe(false);

      setShowProgress(true);
      expect(useSettingsStore.getState().settings.reader.showProgress).toBe(true);
    });
  });

  describe('Two Page Spread Settings', () => {
    it('should set two page spread', () => {
      const { setTwoPageSpread } = useSettingsStore.getState();

      setTwoPageSpread(true);
      expect(useSettingsStore.getState().settings.reader.twoPageSpread).toBe(true);

      setTwoPageSpread(false);
      expect(useSettingsStore.getState().settings.reader.twoPageSpread).toBe(false);
    });
  });

  describe('updateReaderSettings', () => {
    it('should update multiple reader settings at once', () => {
      const { updateReaderSettings } = useSettingsStore.getState();

      updateReaderSettings({
        fontSize: 20,
        lineHeight: 2.0,
        theme: 'sepia',
      });

      const { settings } = useSettingsStore.getState();
      expect(settings.reader.fontSize).toBe(20);
      expect(settings.reader.lineHeight).toBe(2.0);
      expect(settings.reader.theme).toBe('sepia');
    });

    it('should preserve other settings when updating partial', () => {
      const { updateReaderSettings } = useSettingsStore.getState();

      const originalFontFamily = useSettingsStore.getState().settings.reader.fontFamily;

      updateReaderSettings({ fontSize: 22 });

      const { settings } = useSettingsStore.getState();
      expect(settings.reader.fontSize).toBe(22);
      expect(settings.reader.fontFamily).toBe(originalFontFamily);
    });
  });

  describe('Library Settings', () => {
    it('should set library sort by', () => {
      const { setLibrarySortBy } = useSettingsStore.getState();

      setLibrarySortBy('title');
      expect(useSettingsStore.getState().settings.library.sortBy).toBe('title');

      setLibrarySortBy('author');
      expect(useSettingsStore.getState().settings.library.sortBy).toBe('author');

      setLibrarySortBy('progress');
      expect(useSettingsStore.getState().settings.library.sortBy).toBe('progress');

      setLibrarySortBy('dateAdded');
      expect(useSettingsStore.getState().settings.library.sortBy).toBe('dateAdded');

      setLibrarySortBy('lastOpened');
      expect(useSettingsStore.getState().settings.library.sortBy).toBe('lastOpened');
    });

    it('should set library sort order', () => {
      const { setLibrarySortOrder } = useSettingsStore.getState();

      setLibrarySortOrder('asc');
      expect(useSettingsStore.getState().settings.library.sortOrder).toBe('asc');

      setLibrarySortOrder('desc');
      expect(useSettingsStore.getState().settings.library.sortOrder).toBe('desc');
    });

    it('should set library view mode', () => {
      const { setLibraryViewMode } = useSettingsStore.getState();

      setLibraryViewMode('list');
      expect(useSettingsStore.getState().settings.library.viewMode).toBe('list');

      setLibraryViewMode('grid');
      expect(useSettingsStore.getState().settings.library.viewMode).toBe('grid');
    });
  });

  describe('Custom Themes', () => {
    it('should add a custom theme', () => {
      const { addCustomTheme } = useSettingsStore.getState();

      addCustomTheme({
        name: 'My Theme',
        backgroundColor: '#1a1a2e',
        textColor: '#eaeaea',
        accentColor: '#0f4c75',
      });

      const { settings } = useSettingsStore.getState();
      expect(settings.customThemes).toHaveLength(1);
      expect(settings.customThemes[0].name).toBe('My Theme');
      expect(settings.customThemes[0].id).toMatch(/^custom-/);
    });

    it('should update a custom theme', () => {
      const { addCustomTheme, updateCustomTheme } = useSettingsStore.getState();

      addCustomTheme({
        name: 'Original Name',
        backgroundColor: '#000',
        textColor: '#fff',
        accentColor: '#00f',
      });

      const themeId = useSettingsStore.getState().settings.customThemes[0].id;

      updateCustomTheme(themeId, { name: 'Updated Name' });

      const { settings } = useSettingsStore.getState();
      expect(settings.customThemes[0].name).toBe('Updated Name');
    });

    it('should delete a custom theme', () => {
      const { addCustomTheme, deleteCustomTheme } = useSettingsStore.getState();

      addCustomTheme({
        name: 'Theme to Delete',
        backgroundColor: '#000',
        textColor: '#fff',
        accentColor: '#00f',
      });

      const themeId = useSettingsStore.getState().settings.customThemes[0].id;

      deleteCustomTheme(themeId);

      const { settings } = useSettingsStore.getState();
      expect(settings.customThemes).toHaveLength(0);
    });

    it('should handle multiple custom themes', () => {
      const { addCustomTheme, deleteCustomTheme } = useSettingsStore.getState();

      addCustomTheme({ name: 'Theme 1', backgroundColor: '#111', textColor: '#fff', accentColor: '#00f' });
      addCustomTheme({ name: 'Theme 2', backgroundColor: '#222', textColor: '#fff', accentColor: '#0f0' });
      addCustomTheme({ name: 'Theme 3', backgroundColor: '#333', textColor: '#fff', accentColor: '#f00' });

      expect(useSettingsStore.getState().settings.customThemes).toHaveLength(3);

      const theme2Id = useSettingsStore.getState().settings.customThemes[1].id;
      deleteCustomTheme(theme2Id);

      const { settings } = useSettingsStore.getState();
      expect(settings.customThemes).toHaveLength(2);
      expect(settings.customThemes.find(t => t.name === 'Theme 2')).toBeUndefined();
    });
  });

  describe('Startup Behavior', () => {
    it('should set startup behavior', () => {
      const { setStartupBehavior } = useSettingsStore.getState();

      setStartupBehavior('lastBook');
      expect(useSettingsStore.getState().settings.startupBehavior).toBe('lastBook');

      setStartupBehavior('library');
      expect(useSettingsStore.getState().settings.startupBehavior).toBe('library');
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset all settings to defaults', () => {
      const {
        setTheme,
        setFontSize,
        setLineHeight,
        setLibrarySortBy,
        addCustomTheme,
        resetToDefaults,
      } = useSettingsStore.getState();

      // Change various settings
      setTheme('dark');
      setFontSize(24);
      setLineHeight(2.5);
      setLibrarySortBy('title');
      addCustomTheme({ name: 'Custom', backgroundColor: '#000', textColor: '#fff', accentColor: '#00f' });

      // Reset
      resetToDefaults();

      // Verify all values are reset to defaults
      const { settings } = useSettingsStore.getState();
      expect(settings.reader.theme).toBe(defaultReaderSettings.theme);
      expect(settings.reader.fontSize).toBe(defaultReaderSettings.fontSize);
      expect(settings.reader.lineHeight).toBe(defaultReaderSettings.lineHeight);
      expect(settings.library.sortBy).toBe(defaultAppSettings.library.sortBy);
      expect(settings.customThemes).toEqual([]);
    });

    it('should update document theme on reset', () => {
      const { setTheme, resetToDefaults } = useSettingsStore.getState();

      setTheme('dark');
      resetToDefaults();

      expect(document.documentElement.setAttribute).toHaveBeenLastCalledWith('data-theme', defaultReaderSettings.theme);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme font sizes', () => {
      const { setFontSize } = useSettingsStore.getState();

      setFontSize(1);
      expect(useSettingsStore.getState().settings.reader.fontSize).toBe(1);

      setFontSize(200);
      expect(useSettingsStore.getState().settings.reader.fontSize).toBe(200);
    });

    it('should handle negative values where applicable', () => {
      const { setLetterSpacing, setMargins } = useSettingsStore.getState();

      setLetterSpacing(-2);
      expect(useSettingsStore.getState().settings.reader.letterSpacing).toBe(-2);

      // Margins shouldn't be negative but store doesn't validate
      setMargins(-10, -10);
      expect(useSettingsStore.getState().settings.reader.marginHorizontal).toBe(-10);
    });

    it('should handle empty font family', () => {
      const { setFontFamily } = useSettingsStore.getState();

      setFontFamily('');
      expect(useSettingsStore.getState().settings.reader.fontFamily).toBe('');
    });

    it('should handle updating non-existent custom theme', () => {
      const { updateCustomTheme } = useSettingsStore.getState();

      // Should not throw
      expect(() => updateCustomTheme('non-existent', { name: 'New Name' })).not.toThrow();
    });

    it('should handle deleting non-existent custom theme', () => {
      const { deleteCustomTheme } = useSettingsStore.getState();

      // Should not throw
      expect(() => deleteCustomTheme('non-existent')).not.toThrow();
    });
  });
});
