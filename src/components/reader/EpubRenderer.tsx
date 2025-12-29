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
    try {
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
    } catch (err) {
      // Ignore insertRule errors - can happen when iframe isn't fully ready
      console.debug('Could not apply styles:', err);
    }
  }, [readerSettings]);

  // Inject CSS directly into epub content - more reliable than themes.default() in production
  const injectContentStyles = useCallback((contents: { document: Document }) => {
    try {
      const doc = contents.document;
      const themeColors = getThemeColors(readerSettings.theme);

      // Remove any previously injected style
      const existingStyle = doc.getElementById('bookreader-injected-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = doc.createElement('style');
      style.id = 'bookreader-injected-styles';
      style.textContent = `
        /* Theme colors - ensures text is readable on all themes */
        body {
          color: ${themeColors.text} !important;
          background-color: ${themeColors.background} !important;
          font-family: ${readerSettings.fontFamily} !important;
          font-size: ${readerSettings.fontSize}px !important;
          line-height: ${readerSettings.lineHeight} !important;
        }

        * {
          color: inherit !important;
        }

        a, a:visited, a:hover {
          color: ${themeColors.link} !important;
        }

        /* Prevent images from being split across columns/pages */
        img, svg, figure, .image, [class*="image"], [class*="cover"], [class*="title"] {
          max-width: 100% !important;
          max-height: 85vh !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
          overflow: hidden !important;
        }

        /* For title pages and full-page images */
        body > div:first-child img,
        section:first-of-type img,
        .titlepage img,
        .halftitlepage img {
          max-height: 80vh !important;
          object-fit: contain !important;
        }

        /* Prevent any element containing only an image from breaking */
        div:has(> img:only-child),
        p:has(> img:only-child),
        figure {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
      `;
      doc.head.appendChild(style);
    } catch (err) {
      console.debug('Could not inject content styles:', err);
    }
  }, [readerSettings.theme, readerSettings.fontFamily, readerSettings.fontSize, readerSettings.lineHeight]);

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
    let regenerateTimeout: ReturnType<typeof setTimeout> | null = null;

    const regenerateLocations = async () => {
      if (!epubRef.current || !renditionRef.current || !isActive) return;
      try {
        await epubRef.current.locations.generate(2048);
        const totalLocs = epubRef.current.locations.length();
        setTotalLocations(totalLocs);

        const currentLoc = (renditionRef.current as unknown as { currentLocation: () => Location | null }).currentLocation?.();
        if (currentLoc?.start?.cfi && totalLocs > 0) {
          const percentage = epubRef.current.locations.percentageFromCfi(currentLoc.start.cfi) || 0;
          const locationIndex = epubRef.current.locations.locationFromCfi?.(currentLoc.start.cfi);
          const progress = Math.min(100, Math.max(0, Math.round(percentage * 100)));
          const currentPage = typeof locationIndex === 'number'
            ? Math.min(totalLocs, Math.max(1, locationIndex + 1))
            : Math.max(1, Math.floor(percentage * totalLocs) + 1);

          updateLocation(currentLoc.start.cfi, currentPage, totalLocs || 1, progress);
        }
      } catch (err) {
        console.error('Failed to regenerate locations', err);
      }
    };

    const handleLocationChange = (location: Location) => {
      if (!epubRef.current || !location.start || !isActive) return;

      const cfi = location.start.cfi;

      // Calculate progress based on generated locations when available
      let progress = 0;
      let totalLocs = 0;
      let currentPage = location.start.displayed?.page || 1;
      let totalPages = location.start.displayed?.total || 1;

      try {
        totalLocs = epubRef.current.locations.length();
        if (totalLocs > 0) {
          const percentage = epubRef.current.locations.percentageFromCfi(cfi);
          progress = Math.round((percentage || 0) * 100);
          currentPage = Math.max(1, Math.round((percentage || 0) * totalLocs));
          totalPages = totalLocs;
        }
      } catch {
        // Locations not ready yet, progress stays 0
      }

      updateLocation(cfi, currentPage, totalPages, progress);

      // Also update totalLocations if we have them now
      if (totalLocs > 0) {
        setTotalLocations(totalLocs);
      }

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

      // Register hook to inject styles directly into each content document
      // This is more reliable than themes.default() in production builds
      rendition.hooks.content.register(injectContentStyles);

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
      rendition.on('relocated', handleLocationChange as unknown as (...args: unknown[]) => void);
      rendition.on('rendered', () => applyStyles(rendition));
      rendition.on('resized', () => {
        if (regenerateTimeout) clearTimeout(regenerateTimeout);
        regenerateTimeout = setTimeout(() => void regenerateLocations(), 120);
      });

      // Start reading session and hide loading - book is now visible
      startSession();
      setLoading(false);

        // Generate locations in background (for progress tracking)
        // Use larger chunk size (2048) for faster generation
        epub.locations.generate(2048).then(() => {
          if (!isActive) return;

          const totalLocs = epub.locations.length();
          setTotalLocations(totalLocs);

          // Recalculate progress now that locations are ready
          // Access location via currentLocation() method
          const currentLoc = (rendition as unknown as { currentLocation: () => Location | null }).currentLocation?.();
          if (currentLoc?.start?.cfi && totalLocs > 0) {
            try {
              const percentage = epub.locations.percentageFromCfi(currentLoc.start.cfi);
              const progress = Math.round((percentage || 0) * 100);
              const currentPage = Math.max(1, Math.round((percentage || 0) * totalLocs));
              updateLocation(currentLoc.start.cfi, currentPage, totalLocs || 1, progress);
            } catch {
              // Ignore errors
            }
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
      if (regenerateTimeout) {
        clearTimeout(regenerateTimeout);
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

      // Also re-inject styles directly into any loaded content views
      // This ensures theme changes work in production builds
      try {
        const contents = renditionRef.current.getContents();
        contents.forEach((content: { document: Document }) => {
          injectContentStyles(content);
        });
      } catch {
        // Ignore errors if contents aren't available yet
      }
    }
  }, [applyStyles, injectContentStyles, readerSettings]);

  // Regenerate locations when reading settings that affect layout change
  useEffect(() => {
    if (!epubRef.current || !renditionRef.current) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const handle = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        void epubRef.current?.locations.generate(2048).then(() => {
          const totalLocs = epubRef.current?.locations.length() ?? 0;
          if (totalLocs > 0) {
            setTotalLocations(totalLocs);
            const currentLoc = (renditionRef.current as unknown as { currentLocation: () => Location | null }).currentLocation?.();
            if (currentLoc?.start?.cfi) {
              try {
                const percentage = epubRef.current?.locations.percentageFromCfi(currentLoc.start.cfi) || 0;
                const locationIndex = epubRef.current?.locations.locationFromCfi?.(currentLoc.start.cfi);
                const progress = Math.min(100, Math.max(0, Math.round((percentage || 0) * 100)));
                const currentPage = typeof locationIndex === 'number'
                  ? Math.min(totalLocs, Math.max(1, locationIndex + 1))
                  : Math.max(1, Math.floor((percentage || 0) * totalLocs) + 1);
                updateLocation(currentLoc.start.cfi, currentPage, totalLocs || 1, progress);
              } catch {
                // ignore
              }
            }
          }
        });
      }, 120);
    };

    handle();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    readerSettings.fontSize,
    readerSettings.lineHeight,
    readerSettings.letterSpacing,
    readerSettings.marginHorizontal,
    readerSettings.marginVertical,
    readerSettings.maxWidth,
    readerSettings.viewMode,
    readerSettings.twoPageSpread,
    updateLocation,
    setTotalLocations,
  ]);

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
