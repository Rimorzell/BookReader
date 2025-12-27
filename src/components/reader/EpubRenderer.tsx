import { forwardRef, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import ePub, { type Book as EpubBook, type Rendition, type Location } from 'epubjs';
import { useReaderStore, useSettingsStore, useLibraryStore, toast } from '../../stores';
import type { Book, TocItem } from '../../types';
import { getTableOfContents } from '../../utils/epubParser';
import { readBookFile } from '../../utils/fileSystem';
import { getThemeColors } from '../../constants';

interface EpubRendererProps {
  book: Book;
  onTocLoaded: (toc: TocItem[]) => void;
}

export const EpubRenderer = forwardRef<EpubRendererRef, EpubRendererProps>(
  ({ book, onTocLoaded }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const epubRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  // Store callbacks in refs to avoid re-triggering initialization effect
  const onTocLoadedRef = useRef(onTocLoaded);
  onTocLoadedRef.current = onTocLoaded;

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

  // Store book.id in ref for callbacks
  const bookIdRef = useRef(book.id);
  bookIdRef.current = book.id;

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
      toast.error('Failed to navigate to that location');
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
      toast.error('Failed to navigate to that position');
    }
  }, []);

  useImperativeHandle(ref, () => ({
    goNext,
    goPrev,
    goToLocation,
    goToPercentage,
  }), [goNext, goPrev, goToLocation, goToPercentage]);

  // Initialize the EPUB - only runs once per book
  useEffect(() => {
    if (!containerRef.current) return;

    let isActive = true;
    const currentContainer = containerRef.current;

    const handleLocationChange = (location: Location) => {
      if (!epubRef.current || !location.start || !isActive) return;

      const cfi = location.start.cfi;

      // Calculate progress - handle case when locations aren't generated yet
      let progress = 0;
      try {
        if (epubRef.current.locations.length() > 0) {
          const percentage = epubRef.current.locations.percentageFromCfi(cfi);
          progress = Math.round((percentage || 0) * 100);
        }
      } catch {
        // Locations not ready yet, progress stays 0
      }

      // Get current page info
      const currentPage = location.start.displayed?.page || 1;
      const totalPages = location.start.displayed?.total || 1;

      updateLocation(cfi, currentPage, totalPages, progress);
      updateReadingProgress(bookIdRef.current, cfi, progress);

      // Get chapter title
      const chapter = epubRef.current.navigation?.toc.find(
        (item) => epubRef.current!.spine.get(item.href)?.cfiBase === location.start.cfi.split('!')[0]
      );
      if (chapter) {
        setCurrentChapter(chapter.label);
      }
    };

    const initEpub = async () => {
      setLoading(true);
      setError(null);

      try {
        // Read the file
        const fileData = await readBookFile(book.filePath);
        if (!isActive) return;

        const arrayBuffer = fileData.buffer as ArrayBuffer;

        // Create epub instance
        const epub = ePub(arrayBuffer);
        epubRef.current = epub;

        await epub.ready;
        if (!isActive) {
          epub.destroy();
          return;
        }

        // Get table of contents
        const toc = await getTableOfContents(epub);
        onTocLoadedRef.current(toc);

        // Create rendition
        const rendition = epub.renderTo(currentContainer, {
          width: '100%',
          height: '100%',
          flow: readerSettings.viewMode === 'scroll' ? 'scrolled' : 'paginated',
          spread: readerSettings.twoPageSpread ? 'auto' : 'none',
        });

        renditionRef.current = rendition;

        // Apply styles
        applyStyles(rendition);

        // Display at last position or beginning FIRST (before generating locations)
        if (book.currentLocation) {
          await rendition.display(book.currentLocation);
        } else {
          await rendition.display();
        }

        if (!isActive) {
          epub.destroy();
          return;
        }

        // Set up event handlers immediately so user can start reading
        rendition.on('locationChanged', handleLocationChange);
        rendition.on('rendered', () => applyStyles(rendition));

        // Start reading session and hide loading - book is now visible
        startSession();
        setLoading(false);

        // Generate locations in background (for progress tracking)
        // Use larger chunk size (2048) for faster generation
        epub.locations.generate(2048).then(() => {
          if (isActive) {
            setTotalLocations(epub.locations.length());
          }
        });
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to load EPUB:', error);
        const message = error instanceof Error ? error.message : 'Failed to load book';
        setError(message);
        toast.error(message);
        setLoading(false);
      }
    };

    void initEpub();

    return () => {
      isActive = false;
      if (epubRef.current) {
        epubRef.current.destroy();
        epubRef.current = null;
      }
      renditionRef.current = null;
    };
  // Only re-run when the book file changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.filePath]);

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

// Export navigation methods for parent component use
export interface EpubRendererRef {
  goNext: () => void;
  goPrev: () => void;
  goToLocation: (cfi: string) => void;
  goToPercentage: (percentage: number) => void;
}
