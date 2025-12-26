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
      'body': {
        'font-family': `"${readerSettings.fontFamily}", serif !important`,
        'font-size': `${readerSettings.fontSize}px !important`,
        'line-height': `${readerSettings.lineHeight} !important`,
        'color': `${themeColors.text} !important`,
        'background-color': `${themeColors.background} !important`,
        'padding': `20px !important`,
      },
      'p': {
        'text-align': `${readerSettings.textAlign} !important`,
        'margin-bottom': `${readerSettings.paragraphSpacing}em !important`,
      },
      'a': {
        'color': `${themeColors.link} !important`,
      },
      'h1, h2, h3, h4, h5, h6': {
        'color': `${themeColors.text} !important`,
      },
      'img': {
        'max-width': '100% !important',
        'height': 'auto !important',
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
