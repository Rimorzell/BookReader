declare module 'epubjs' {
  export interface Book {
    ready: Promise<void>;
    loaded: {
      metadata: Promise<{
        title?: string;
        creator?: string;
        description?: string;
        pubdate?: string;
        publisher?: string;
        identifier?: string;
        language?: string;
        rights?: string;
        modified_date?: string;
      }>;
      navigation: Promise<void>;
    };
    navigation: {
      toc: NavItem[];
    };
    spine: {
      get: (href: string) => { cfiBase: string } | null;
      spineItems: SpineItem[];
    };
    locations: {
      generate: (chars: number) => Promise<void>;
      length: () => number;
      percentageFromCfi: (cfi: string) => number;
      cfiFromPercentage: (percentage: number) => string;
    };
    coverUrl: () => Promise<string | null>;
    destroy: () => void;
    renderTo: (
      element: Element,
      options?: {
        width?: string | number;
        height?: string | number;
        flow?: 'paginated' | 'scrolled';
        spread?: 'none' | 'auto';
        manager?: 'continuous' | 'default';
      }
    ) => Rendition;
  }

  export interface SpineItem {
    load: (book: Book) => Promise<SpineContents>;
    href: string;
    index: number;
  }

  export interface SpineContents {
    find: (query: string) => SearchResult[];
  }

  export interface SearchResult {
    cfi: string;
    excerpt: string;
  }

  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  // Event handler types for Rendition
  export type LocationChangedHandler = (location: Location) => void;
  export type RenderedHandler = (section: unknown) => void;
  export type MouseEventHandler = (event: MouseEvent) => void;

  export interface Rendition {
    display: (target?: string) => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    on(event: 'locationChanged', callback: LocationChangedHandler): void;
    on(event: 'rendered', callback: RenderedHandler): void;
    on(event: 'click', callback: MouseEventHandler): void;
    on(event: 'mousedown', callback: MouseEventHandler): void;
    on(event: 'mouseup', callback: MouseEventHandler): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: 'locationChanged', callback: LocationChangedHandler): void;
    off(event: 'rendered', callback: RenderedHandler): void;
    off(event: 'click', callback: MouseEventHandler): void;
    off(event: 'mousedown', callback: MouseEventHandler): void;
    off(event: 'mouseup', callback: MouseEventHandler): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    themes: {
      default: (rules: Record<string, Record<string, string>>) => void;
      override: (selector: string, css: string) => void;
      register: (name: string, rules: Record<string, Record<string, string>>) => void;
      select: (name: string) => void;
    };
    getRange: (cfi: string) => Range;
    getContents: () => {
      document: Document;
      window: Window;
    }[];
    destroy: () => void;
  }

  export interface Location {
    start: {
      cfi: string;
      percentage: number;
      displayed?: {
        page: number;
        total: number;
      };
    };
    end?: {
      cfi: string;
      percentage: number;
    };
  }

  function ePub(data: ArrayBuffer | string): Book;
  export default ePub;
}
