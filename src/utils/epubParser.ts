import ePub, { type Book as EpubBook, type Rendition, type NavItem } from 'epubjs';
import { arrayBufferToBase64 } from './fileSystem';

export interface EpubMetadata {
  title: string;
  author: string;
  description?: string;
  cover?: ArrayBuffer;
  coverUrl?: string;
  coverDataUrl?: string;
}

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

export async function parseEpubMetadata(arrayBuffer: ArrayBuffer): Promise<EpubMetadata> {
  const book = ePub(arrayBuffer);
  await book.ready;

  const metadata = await book.loaded.metadata;
  let coverUrl: string | undefined;
  let coverDataUrl: string | undefined;

  try {
    coverUrl = await book.coverUrl() ?? undefined;

    if (coverUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const response = await fetch(coverUrl, { signal: controller.signal });
        const buf = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        coverDataUrl = `data:image/jpeg;base64,${base64}`;
        clearTimeout(timeout);
      } catch (err) {
        console.warn('Failed to inline cover image:', err);
      }
    }
  } catch {
    // Cover extraction failed
  }

  return {
    title: metadata.title || 'Unknown Title',
    author: metadata.creator || 'Unknown Author',
    description: metadata.description,
    coverUrl,
    coverDataUrl,
  };
}

export function createEpubInstance(arrayBuffer: ArrayBuffer): EpubBook {
  return ePub(arrayBuffer);
}

export async function getTableOfContents(book: EpubBook): Promise<TocItem[]> {
  await book.loaded.navigation;
  const navigation = book.navigation;

  const mapNavItem = (item: NavItem): TocItem => ({
    id: item.id,
    label: item.label,
    href: item.href,
    subitems: item.subitems?.map(mapNavItem),
  });

  return navigation.toc.map(mapNavItem);
}

export function createRendition(
  book: EpubBook,
  element: Element,
  options: {
    width?: string | number;
    height?: string | number;
    flow?: 'paginated' | 'scrolled';
    spread?: 'none' | 'auto';
  } = {}
): Rendition {
  const rendition = book.renderTo(element, {
    width: options.width || '100%',
    height: options.height || '100%',
    flow: options.flow || 'paginated',
    spread: options.spread || 'none',
    manager: 'continuous',
  });

  return rendition;
}

export function applyReaderStyles(
  rendition: Rendition,
  styles: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlign?: 'left' | 'justify';
    paragraphSpacing?: number;
    textColor?: string;
    backgroundColor?: string;
    linkColor?: string;
  }
): void {
  const rules: Record<string, Record<string, string>> = {
    body: {},
    p: {},
    a: {},
    '*': {},
  };

  if (styles.fontFamily) {
    rules.body['font-family'] = `${styles.fontFamily} !important`;
  }

  if (styles.fontSize) {
    rules.body['font-size'] = `${styles.fontSize}px !important`;
  }

  if (styles.lineHeight) {
    rules.body['line-height'] = `${styles.lineHeight} !important`;
  }

  if (styles.letterSpacing !== undefined) {
    rules.body['letter-spacing'] = `${styles.letterSpacing}px !important`;
  }

  if (styles.textAlign) {
    rules['p']['text-align'] = `${styles.textAlign} !important`;
  }

  if (styles.paragraphSpacing) {
    rules['p']['margin-bottom'] = `${styles.paragraphSpacing}em !important`;
  }

  if (styles.textColor) {
    rules.body['color'] = `${styles.textColor} !important`;
    rules['*']['color'] = `${styles.textColor} !important`;
  }

  if (styles.backgroundColor) {
    rules.body['background-color'] = `${styles.backgroundColor} !important`;
  }

  if (styles.linkColor) {
    rules['a']['color'] = `${styles.linkColor} !important`;
  }

  // Apply rules
  Object.entries(rules).forEach(([selector, properties]) => {
    if (Object.keys(properties).length > 0) {
      const cssString = Object.entries(properties)
        .map(([prop, val]) => `${prop}: ${val}`)
        .join('; ');
      rendition.themes.override(selector, cssString);
    }
  });
}

export function calculateProgress(
  location: { start: { percentage: number }; end?: { percentage: number } } | null
): number {
  if (!location || !location.start) return 0;
  return Math.round(location.start.percentage * 100);
}

export async function searchInBook(
  book: EpubBook,
  query: string
): Promise<{ cfi: string; excerpt: string }[]> {
  const results: { cfi: string; excerpt: string }[] = [];

  if (!query.trim()) return results;

  try {
    await book.ready;
    const spine = book.spine;

    for (const section of (spine as unknown as { spineItems: { load: (book: EpubBook) => Promise<{ find: (query: string) => { cfi: string; excerpt: string }[] }> }[] }).spineItems) {
      const contents = await section.load(book);
      const found = contents.find(query);
      results.push(...found);
    }
  } catch (error) {
    console.error('Search error:', error);
  }

  return results;
}

export function extractCfiPage(cfi: string): string {
  // Extract a simplified page reference from CFI
  const match = cfi.match(/\[(\d+)\]/);
  return match ? match[1] : '0';
}
