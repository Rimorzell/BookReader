import { describe, it, expect } from 'vitest';
import {
  defaultReaderSettings,
  defaultAppSettings,
  fontFamilies,
} from './index';

describe('Default Settings', () => {
  describe('defaultReaderSettings', () => {
    it('should have valid theme', () => {
      expect(['light', 'sepia', 'dark', 'black']).toContain(defaultReaderSettings.theme);
    });

    it('should have valid font family', () => {
      expect(defaultReaderSettings.fontFamily).toBeTruthy();
    });

    it('should have reasonable font size', () => {
      expect(defaultReaderSettings.fontSize).toBeGreaterThanOrEqual(10);
      expect(defaultReaderSettings.fontSize).toBeLessThanOrEqual(40);
    });

    it('should have reasonable line height', () => {
      expect(defaultReaderSettings.lineHeight).toBeGreaterThanOrEqual(1);
      expect(defaultReaderSettings.lineHeight).toBeLessThanOrEqual(3);
    });

    it('should have valid letter spacing', () => {
      expect(typeof defaultReaderSettings.letterSpacing).toBe('number');
    });

    it('should have valid text alignment', () => {
      expect(['left', 'justify']).toContain(defaultReaderSettings.textAlign);
    });

    it('should have positive margins', () => {
      expect(defaultReaderSettings.marginHorizontal).toBeGreaterThanOrEqual(0);
      expect(defaultReaderSettings.marginVertical).toBeGreaterThanOrEqual(0);
    });

    it('should have reasonable max width', () => {
      expect(defaultReaderSettings.maxWidth).toBeGreaterThan(0);
    });

    it('should have positive paragraph spacing', () => {
      expect(defaultReaderSettings.paragraphSpacing).toBeGreaterThan(0);
    });

    it('should have valid page animation', () => {
      expect(['slide', 'fade', 'none']).toContain(defaultReaderSettings.pageAnimation);
    });

    it('should have valid view mode', () => {
      expect(['paginated', 'scroll']).toContain(defaultReaderSettings.viewMode);
    });

    it('should have boolean showProgress', () => {
      expect(typeof defaultReaderSettings.showProgress).toBe('boolean');
    });

    it('should have boolean twoPageSpread', () => {
      expect(typeof defaultReaderSettings.twoPageSpread).toBe('boolean');
    });
  });

  describe('defaultAppSettings', () => {
    it('should include reader settings', () => {
      expect(defaultAppSettings.reader).toBeDefined();
      expect(defaultAppSettings.reader).toEqual(defaultReaderSettings);
    });

    it('should have valid library sort settings', () => {
      expect(['dateAdded', 'lastOpened', 'title', 'author', 'progress']).toContain(defaultAppSettings.library.sortBy);
      expect(['asc', 'desc']).toContain(defaultAppSettings.library.sortOrder);
    });

    it('should have valid library view mode', () => {
      expect(['grid', 'list']).toContain(defaultAppSettings.library.viewMode);
    });

    it('should have valid startup behavior', () => {
      expect(['library', 'lastBook']).toContain(defaultAppSettings.startupBehavior);
    });

    it('should have empty custom themes by default', () => {
      expect(defaultAppSettings.customThemes).toEqual([]);
    });
  });
});

describe('fontFamilies', () => {
  it('should have at least one font family', () => {
    expect(fontFamilies.length).toBeGreaterThan(0);
  });

  it('should have unique font names', () => {
    const names = fontFamilies.map(f => f.name);
    const uniqueNames = [...new Set(names)];
    expect(uniqueNames.length).toBe(names.length);
  });

  it('should have unique font values', () => {
    const values = fontFamilies.map(f => f.value);
    const uniqueValues = [...new Set(values)];
    expect(uniqueValues.length).toBe(values.length);
  });

  it('should have valid categories', () => {
    const validCategories = ['serif', 'sans-serif', 'monospace'];
    fontFamilies.forEach(font => {
      expect(validCategories).toContain(font.category);
    });
  });

  it('should have name and value for each font', () => {
    fontFamilies.forEach(font => {
      expect(font.name).toBeTruthy();
      expect(font.value).toBeTruthy();
      expect(typeof font.name).toBe('string');
      expect(typeof font.value).toBe('string');
    });
  });

  it('should include at least one serif font', () => {
    const serifFonts = fontFamilies.filter(f => f.category === 'serif');
    expect(serifFonts.length).toBeGreaterThan(0);
  });

  it('should include at least one sans-serif font', () => {
    const sansSerifFonts = fontFamilies.filter(f => f.category === 'sans-serif');
    expect(sansSerifFonts.length).toBeGreaterThan(0);
  });
});

describe('Type Consistency', () => {
  it('should have matching reader settings in app settings', () => {
    expect(defaultAppSettings.reader.theme).toBe(defaultReaderSettings.theme);
    expect(defaultAppSettings.reader.fontSize).toBe(defaultReaderSettings.fontSize);
    expect(defaultAppSettings.reader.lineHeight).toBe(defaultReaderSettings.lineHeight);
  });
});
