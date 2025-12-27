import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import ePub, { type Book as EpubBook, type Rendition, type Location } from 'epubjs';
import { useReaderStore, useSettingsStore, useLibraryStore } from '../../stores';
import type { Book, TocItem } from '../../types';
import { getTableOfContents } from '../../utils/epubParser';
import { readBookFile } from '../../utils/fileSystem';

export interface EpubRendererHandle {
  goNext: () => void;
  goPrev: () => void;
  goToLocation: (cfi: string) => void;
}

interface EpubRendererProps {
  book: Book;
  onTocLoaded: (toc: TocItem[]) => void;
}

export const EpubRenderer = forwardRef<EpubRendererHandle, EpubRendererProps>(function EpubRenderer({ book, onTocLoaded }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const epubRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const {
    setLoading,
    setError,
    updateLocation,
    setTotalLocations,
    setCurrentChapter,
    startSession,
  } = useReaderStore();

  const { settings } = useSettingsStore();
  const { updateReadingProgress } = useLibraryStore();
  const readerSettings = settings.reader;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Also check after a short delay to ensure container is rendered
    const timeout = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize the EPUB when we have dimensions
  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0 || dimensions.height === 0) return;
    if (epubRef.current) return; // Already initialized

    const initEpub = async () => {
      setLoading(true);
      setError(null);

      try {
        // Read the file
        const fileData = await readBookFile(book.filePath);
        const arrayBuffer = fileData.buffer as ArrayBuffer;

        // Create epub instance
        const epub = ePub(arrayBuffer);
        epubRef.current = epub;

        await epub.ready;

        // Get table of contents
        const toc = await getTableOfContents(epub);
        onTocLoaded(toc);

        // Create rendition with explicit pixel dimensions
        const rendition = epub.renderTo(containerRef.current!, {
          width: dimensions.width,
          height: dimensions.height,
          spread: 'none',
          flow: 'paginated',
        });

        renditionRef.current = rendition;

        // Apply initial styles
        applyStyles(rendition);

        // Display the book (at last position or beginning)
        if (book.currentLocation) {
          await rendition.display(book.currentLocation);
        } else {
          await rendition.display();
        }

        // Generate locations for progress tracking (do this after display)
        try {
          await epub.locations.generate(1600);
          setTotalLocations(epub.locations.length());
        } catch (locError) {
          console.warn('Could not generate locations:', locError);
        }

        // Set up event handlers
        rendition.on('relocated', ((location: Location) => {
          if (!location.start) return;

          const cfi = location.start.cfi;
          let progress = 0;

          try {
            const percentage = epub.locations.percentageFromCfi(cfi);
            progress = Math.round((percentage || 0) * 100);
          } catch {
            // Locations might not be ready yet
          }

          const currentPage = location.start.displayed?.page || 1;
          const totalPages = location.start.displayed?.total || 1;

          updateLocation(cfi, currentPage, totalPages, progress);
          updateReadingProgress(book.id, cfi, progress);

          // Get chapter title
          const chapter = epub.navigation?.toc.find(
            (item) => {
              try {
                return epub.spine.get(item.href)?.cfiBase === cfi.split('!')[0];
              } catch {
                return false;
              }
            }
          );
          if (chapter) {
            setCurrentChapter(chapter.label);
          }
        }) as unknown as (...args: unknown[]) => void);

        // Handle rendered event to reapply styles
        rendition.on('rendered', () => {
          applyStyles(rendition);
        });

        // Start reading session
        startSession();
        setLoading(false);
      } catch (error) {
        console.error('Failed to load EPUB:', error);
        setError('Failed to load book');
        setLoading(false);
      }
    };

    initEpub();

    return () => {
      if (epubRef.current) {
        epubRef.current.destroy();
        epubRef.current = null;
        renditionRef.current = null;
      }
    };
  }, [book.filePath, dimensions.width, dimensions.height]);

  // Handle resize - update rendition size
  useEffect(() => {
    if (renditionRef.current && dimensions.width > 0 && dimensions.height > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (renditionRef.current as any).resize(dimensions.width, dimensions.height);
    }
  }, [dimensions]);

  // Apply reader settings when they change
  useEffect(() => {
    if (renditionRef.current) {
      applyStyles(renditionRef.current);
    }
  }, [readerSettings]);

  const applyStyles = useCallback((rendition: Rendition) => {
    const themeColors = getThemeColors(readerSettings.theme);

    rendition.themes.default({
      // Base body styles
      'body': {
        'font-family': `"${readerSettings.fontFamily}", "Georgia", "Times New Roman", serif !important`,
        'font-size': `${readerSettings.fontSize}px !important`,
        'line-height': `${readerSettings.lineHeight} !important`,
        'color': `${themeColors.text} !important`,
        'background-color': `${themeColors.background} !important`,
        'padding': '40px 60px !important',
        'margin': '0 auto !important',
        'max-width': '800px !important',
        'text-rendering': 'optimizeLegibility !important',
        '-webkit-font-smoothing': 'antialiased !important',
        'word-spacing': '0.05em !important',
      },
      // Paragraphs
      'p': {
        'text-align': `${readerSettings.textAlign} !important`,
        'margin': '0 0 1em 0 !important',
        'text-indent': '0 !important',
        'orphans': '2 !important',
        'widows': '2 !important',
      },
      // Headings
      'h1': {
        'font-size': '1.8em !important',
        'font-weight': 'bold !important',
        'margin': '1em 0 0.5em 0 !important',
        'color': `${themeColors.text} !important`,
        'text-align': 'center !important',
        'line-height': '1.2 !important',
      },
      'h2': {
        'font-size': '1.5em !important',
        'font-weight': 'bold !important',
        'margin': '1em 0 0.5em 0 !important',
        'color': `${themeColors.text} !important`,
        'line-height': '1.3 !important',
      },
      'h3': {
        'font-size': '1.3em !important',
        'font-weight': 'bold !important',
        'margin': '1em 0 0.5em 0 !important',
        'color': `${themeColors.text} !important`,
        'line-height': '1.3 !important',
      },
      'h4, h5, h6': {
        'font-size': '1.1em !important',
        'font-weight': 'bold !important',
        'margin': '1em 0 0.5em 0 !important',
        'color': `${themeColors.text} !important`,
        'line-height': '1.4 !important',
      },
      // Links
      'a': {
        'color': `${themeColors.link} !important`,
        'text-decoration': 'none !important',
      },
      'a:hover': {
        'text-decoration': 'underline !important',
      },
      // Images - centered and constrained
      'img': {
        'max-width': '100% !important',
        'max-height': '80vh !important',
        'height': 'auto !important',
        'display': 'block !important',
        'margin': '1em auto !important',
        'object-fit': 'contain !important',
      },
      // Figure elements
      'figure': {
        'margin': '1.5em auto !important',
        'text-align': 'center !important',
        'max-width': '100% !important',
      },
      'figcaption': {
        'font-size': '0.9em !important',
        'color': `${themeColors.text} !important`,
        'opacity': '0.8 !important',
        'margin-top': '0.5em !important',
        'font-style': 'italic !important',
      },
      // Blockquotes
      'blockquote': {
        'margin': '1em 2em !important',
        'padding-left': '1em !important',
        'border-left': `3px solid ${themeColors.link} !important`,
        'font-style': 'italic !important',
        'opacity': '0.9 !important',
      },
      // Lists
      'ul, ol': {
        'margin': '1em 0 !important',
        'padding-left': '2em !important',
      },
      'li': {
        'margin-bottom': '0.5em !important',
      },
      // Code blocks
      'pre, code': {
        'font-family': '"Menlo", "Monaco", "Courier New", monospace !important',
        'font-size': '0.9em !important',
        'background-color': `${readerSettings.theme === 'light' || readerSettings.theme === 'sepia' ? '#f5f5f5' : 'rgba(255,255,255,0.1)'} !important`,
        'padding': '0.2em 0.4em !important',
        'border-radius': '3px !important',
      },
      'pre': {
        'padding': '1em !important',
        'overflow-x': 'auto !important',
        'white-space': 'pre-wrap !important',
        'word-wrap': 'break-word !important',
      },
      // Tables
      'table': {
        'width': '100% !important',
        'border-collapse': 'collapse !important',
        'margin': '1em 0 !important',
      },
      'th, td': {
        'padding': '0.5em !important',
        'border': `1px solid ${themeColors.text}33 !important`,
        'text-align': 'left !important',
      },
      'th': {
        'font-weight': 'bold !important',
        'background-color': `${themeColors.text}11 !important`,
      },
      // Horizontal rule
      'hr': {
        'border': 'none !important',
        'border-top': `1px solid ${themeColors.text}33 !important`,
        'margin': '2em 0 !important',
      },
      // Emphasis
      'em, i': {
        'font-style': 'italic !important',
      },
      'strong, b': {
        'font-weight': 'bold !important',
      },
      // Small text
      'small': {
        'font-size': '0.85em !important',
      },
      // SVG images
      'svg': {
        'max-width': '100% !important',
        'height': 'auto !important',
      },
      // Cover images often have specific classes
      '.cover, .cover-image, [class*="cover"]': {
        'max-width': '100% !important',
        'max-height': '90vh !important',
        'margin': '0 auto !important',
        'display': 'block !important',
      },
    });
  }, [readerSettings]);

  // Navigation methods
  const goNext = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const goPrev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  const goToLocation = useCallback((cfi: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi);
    }
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    goNext,
    goPrev,
    goToLocation,
  }), [goNext, goPrev, goToLocation]);

  // Keyboard navigation on window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const themeColors = getThemeColors(readerSettings.theme);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        backgroundColor: themeColors.background,
      }}
    />
  );
});

function getThemeColors(theme: string) {
  switch (theme) {
    case 'sepia':
      return {
        background: '#f8f3e8',
        text: '#433422',
        link: '#b5651d',
      };
    case 'dark':
      return {
        background: '#1c1c1e',
        text: '#f5f5f7',
        link: '#0a84ff',
      };
    case 'black':
      return {
        background: '#000000',
        text: '#ffffff',
        link: '#0a84ff',
      };
    default:
      return {
        background: '#ffffff',
        text: '#1d1d1f',
        link: '#007aff',
      };
  }
}
