import { forwardRef, useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import ePub, { type Book as EpubBook, type Rendition, type Location } from 'epubjs';
import { useReaderStore, useSettingsStore, useLibraryStore } from '../../stores';
import type { Book, TocItem } from '../../types';
import { getTableOfContents } from '../../utils/epubParser';
import { readBookFile } from '../../utils/fileSystem';

interface EpubRendererProps {
  book: Book;
  onTocLoaded: (toc: TocItem[]) => void;
}

export const EpubRenderer = forwardRef<EpubRendererRef, EpubRendererProps>(
  ({ book, onTocLoaded }, ref) => {
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

  const [isInitialized, setIsInitialized] = useState(false);

  const applyStyles = useCallback((rendition: Rendition) => {
    // Get theme colors
    const themeColors = getThemeColors(readerSettings.theme);

    rendition.themes.default({
      body: {
        'font-family': `${readerSettings.fontFamily} !important`,
        'font-size': `${readerSettings.fontSize}px !important`,
        'line-height': `${readerSettings.lineHeight} !important`,
        'letter-spacing': `${readerSettings.letterSpacing}px !important`,
        color: `${themeColors.text} !important`,
        'background-color': `${themeColors.background} !important`,
        padding: `${readerSettings.marginVertical}px ${readerSettings.marginHorizontal}px !important`,
        'max-width': `${readerSettings.maxWidth}px`,
        margin: '0 auto',
      },
      p: {
        'text-align': `${readerSettings.textAlign} !important`,
        'margin-bottom': `${readerSettings.paragraphSpacing}em !important`,
      },
      a: {
        color: `${themeColors.link} !important`,
      },
    });
  }, [readerSettings]);

  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goToLocation = useCallback(async (target: string) => {
    if (!renditionRef.current) return;
    try {
      await renditionRef.current.display(target);
    } catch (err) {
      console.error('Failed to navigate to location:', err);
    }
  }, []);

  const goToPercentage = useCallback(async (percentage: number) => {
    if (!epubRef.current || !renditionRef.current) return;
    try {
      const normalized = Math.max(0, Math.min(percentage, 100)) / 100;
      const cfi = epubRef.current.locations.cfiFromPercentage(normalized);
      await renditionRef.current.display(cfi);
    } catch (err) {
      console.error('Failed to navigate to percentage:', err);
    }
  }, []);

  const handleLocationChange = useCallback((location: Location) => {
    if (!epubRef.current || !location.start) return;

    const cfi = location.start.cfi;
    const percentage = epubRef.current.locations.percentageFromCfi(cfi);
    const progress = Math.round(percentage * 100);

    // Get current page info
    const currentPage = location.start.displayed?.page || 1;
    const totalPages = location.start.displayed?.total || 1;

    updateLocation(cfi, currentPage, totalPages, progress);
    updateReadingProgress(book.id, cfi, progress);

    // Get chapter title
    const chapter = epubRef.current.navigation?.toc.find(
      (item) => epubRef.current!.spine.get(item.href)?.cfiBase === location.start.cfi.split('!')[0]
    );
    if (chapter) {
      setCurrentChapter(chapter.label);
    }
  }, [book.id, setCurrentChapter, updateLocation, updateReadingProgress]);

  const handleClick = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !renditionRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Click zones: left third = prev, right third = next
    if (x < width / 3) {
      renditionRef.current.prev();
    } else if (x > (2 * width) / 3) {
      renditionRef.current.next();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    goNext,
    goPrev,
    goToLocation,
    goToPercentage,
  }), [goNext, goPrev, goToLocation, goToPercentage]);

  // Initialize the EPUB
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

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

        // Create rendition
        const rendition = epub.renderTo(containerRef.current!, {
          width: '100%',
          height: '100%',
          flow: readerSettings.viewMode === 'scroll' ? 'scrolled' : 'paginated',
          spread: readerSettings.twoPageSpread ? 'auto' : 'none',
        });

        renditionRef.current = rendition;

        // Apply styles
        applyStyles(rendition);

        // Generate locations for progress tracking
        await epub.locations.generate(1024);
        setTotalLocations(epub.locations.length());

        // Display at last position or beginning
        if (book.currentLocation) {
          await rendition.display(book.currentLocation);
        } else {
          await rendition.display();
        }

        // Set up event handlers
        rendition.on('locationChanged', handleLocationChange as unknown as (...args: unknown[]) => void);

        rendition.on('rendered', () => {
          applyStyles(rendition);
        });

        // Handle clicks for navigation
        rendition.on('click', handleClick as unknown as (...args: unknown[]) => void);

        // Start reading session
        startSession();
        setIsInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load EPUB:', error);
        setError('Failed to load book');
        setLoading(false);
      }
    };

    void initEpub();

    return () => {
      if (epubRef.current) {
        epubRef.current.destroy();
      }
    };
  }, [
    book.currentLocation,
    book.filePath,
    handleClick,
    handleLocationChange,
    isInitialized,
    onTocLoaded,
    applyStyles,
    readerSettings.twoPageSpread,
    readerSettings.viewMode,
    setError,
    setLoading,
    setTotalLocations,
    startSession,
  ]);

  // Apply reader settings when they change
  useEffect(() => {
    if (renditionRef.current) {
      applyStyles(renditionRef.current);
    }
  }, [applyStyles, readerSettings]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full reader-content"
      style={{
        backgroundColor: getThemeColors(readerSettings.theme).background,
      }}
    />
  );
});
EpubRenderer.displayName = 'EpubRenderer';

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

// Export navigation methods for parent component use
export interface EpubRendererRef {
  goNext: () => void;
  goPrev: () => void;
  goToLocation: (cfi: string) => void;
  goToPercentage: (percentage: number) => void;
}
