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
      spineItems: unknown[];
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

  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  export interface Rendition {
    display: (target?: string) => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    off: (event: string, callback: (...args: unknown[]) => void) => void;
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
