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

type ContentLike = {
  document: Document;
  window?: Window;
  on?: (event: string, listener: () => void) => void;
  off?: (event: string, listener: () => void) => void;
};

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
  const injectContentStyles = useCallback((contents: ContentLike) => {
    try {
      const doc = contents.document;
      const themeColors = getThemeColors(readerSettings.theme);

      // CRITICAL: Set inline styles directly on body - this has highest priority
      // and cannot be overridden by any stylesheet
      const body = doc.body;
      if (body) {
        body.style.setProperty('color', themeColors.text, 'important');
        body.style.setProperty('background-color', themeColors.background, 'important');
        body.style.setProperty('-webkit-text-fill-color', themeColors.text, 'important');
      }

      // Also set on html element for full coverage
      const html = doc.documentElement;
      if (html) {
        html.style.setProperty('color', themeColors.text, 'important');
        html.style.setProperty('background-color', themeColors.background, 'important');
      }

      // Remove any previously injected style
      const existingStyle = doc.getElementById('bookreader-injected-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = doc.createElement('style');
      style.id = 'bookreader-injected-styles';
      style.textContent = `
        /* Theme colors - ensures text is readable on all themes */
        /* Use high specificity selectors to override EPUB styles */
        :root, html, body {
          color: ${themeColors.text} !important;
          background-color: ${themeColors.background} !important;
        }

        body {
          font-family: ${readerSettings.fontFamily} !important;
          font-size: ${readerSettings.fontSize}px !important;
          line-height: ${readerSettings.lineHeight} !important;
          margin: 0 auto !important;
          padding: ${readerSettings.marginVertical}px ${readerSettings.marginHorizontal}px !important;
          max-width: ${readerSettings.maxWidth}px !important;
          min-height: 100vh !important;
          column-gap: 0 !important;
          background-position: center !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
        }

        /* Force text color on ALL elements - handles inline styles from EPUBs */
        *, *::before, *::after {
          color: ${themeColors.text} !important;
        }

        /* SVG elements need separate handling for fill/stroke */
        svg, svg * {
          fill: ${themeColors.text} !important;
          stroke: ${themeColors.text} !important;
        }

        /* Preserve image colors - don't apply text color filter to images */
        img {
          color: unset !important;
        }

        /* Explicitly handle common text elements that EPUBs may style inline */
        h1, h2, h3, h4, h5, h6, p, span, div, li, td, th,
        blockquote, cite, em, strong, b, i, u, s, small, big,
        article, section, header, footer, nav, aside, main,
        label, caption, figcaption, legend, dt, dd, address,
        pre, code, samp, kbd, var, abbr, acronym, dfn, q, sub, sup {
          color: ${themeColors.text} !important;
          -webkit-text-fill-color: ${themeColors.text} !important;
        }

        a, a:visited, a:hover, a:active, a:focus {
          color: ${themeColors.link} !important;
          -webkit-text-fill-color: ${themeColors.link} !important;
        }

        /* Override any inline style attributes that set color */
        [style*="color"] {
          color: ${themeColors.text} !important;
          -webkit-text-fill-color: ${themeColors.text} !important;
        }

        a[style*="color"], a[style*="color"]:visited {
          color: ${themeColors.link} !important;
          -webkit-text-fill-color: ${themeColors.link} !important;
        }

        /* ========== PAGE BREAK PREVENTION FOR IMAGES ========== */

        /* Base image styles - prevent splitting */
        img, svg {
          max-width: 100% !important;
          max-height: 85vh !important;
          width: auto !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          object-fit: contain !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
          overflow: hidden !important;
        }

        /* Figure elements - common wrapper for images */
        figure {
          max-width: 100% !important;
          max-height: 90vh !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
          display: block !important;
          margin: 0 auto !important;
          overflow: hidden !important;
          background-color: ${themeColors.background} !important;
        }

        /* Cover pages and title pages - these are typically at the beginning */
        /* Target common class names and structural patterns */
        .cover, .titlepage, .halftitlepage, .frontmatter,
        .image, .illustration, .figure, .full-page,
        [class*="cover"], [class*="title"], [class*="image"],
        [class*="frontmatter"], [class*="illustration"],
        [id*="cover"], [id*="title"] {
          max-width: 100% !important;
          max-height: 95vh !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
          display: block !important;
          overflow: hidden !important;
        }

        /* First child elements often contain cover/title images */
        body > *:first-child,
        body > div:first-child,
        body > section:first-child {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }

        /* Images inside first elements */
        body > *:first-child img,
        body > div:first-child img,
        body > section:first-child img,
        section:first-of-type img,
        .titlepage img,
        .halftitlepage img,
        .cover img,
        [class*="cover"] img {
          max-height: 90vh !important;
          max-width: 100% !important;
          height: auto !important;
          width: auto !important;
        }

        /* Containers with single images - fallback without :has() for Safari 13 */
        /* These elements commonly wrap images */
        figure, .image, .illustration, .figure,
        [class*="image"], [class*="figure"], [class*="illustration"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-direction: column !important;
          background-color: ${themeColors.background} !important;
        }

        /* Modern browsers: use :has() for more precise targeting */
        @supports selector(:has(*)) {
          div:has(> img:only-child),
          p:has(> img:only-child),
          section:has(> img:only-child),
          section:has(> figure:only-child) {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: ${themeColors.background} !important;
          }
        }

        /* Prevent orphans and widows for text content */
        p, h1, h2, h3, h4, h5, h6 {
          orphans: 3 !important;
          widows: 3 !important;
        }
      `;

      // Append style to the END of head to ensure it comes after EPUB styles
      doc.head.appendChild(style);

      // Apply inline styles directly to ALL text elements for maximum override
      // This ensures even elements with inline styles are overridden
      const applyInlineStylesToElements = () => {
        const textElements = doc.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, span, div, li, td, th, blockquote, ' +
          'cite, em, strong, b, i, u, s, article, section, header, footer, ' +
          'pre, code, figcaption, dt, dd, address, label'
        );
        textElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Only set if not already set to our theme color
          const currentColor = htmlEl.style.getPropertyValue('color');
          if (currentColor !== themeColors.text) {
            htmlEl.style.setProperty('color', themeColors.text, 'important');
            htmlEl.style.setProperty('-webkit-text-fill-color', themeColors.text, 'important');
          }
        });

        // Handle links separately
        const links = doc.querySelectorAll('a');
        links.forEach((el) => {
          el.style.setProperty('color', themeColors.link, 'important');
          el.style.setProperty('-webkit-text-fill-color', themeColors.link, 'important');
        });
      };

      // Apply immediately
      applyInlineStylesToElements();

      // Also apply after a short delay to catch any late-loading content
      // This is critical for production builds where styles may load asynchronously
      setTimeout(applyInlineStylesToElements, 50);
      setTimeout(applyInlineStylesToElements, 150);
    } catch (err) {
      console.debug('Could not inject content styles:', err);
    }
  }, [
    readerSettings.fontFamily,
    readerSettings.fontSize,
    readerSettings.lineHeight,
    readerSettings.marginHorizontal,
    readerSettings.marginVertical,
    readerSettings.maxWidth,
    readerSettings.theme,
  ]);

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
        rendition.hooks.content.register((rawContents) => {
          const contents = rawContents as unknown as ContentLike;
          injectContentStyles(contents);

          const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            if (key === 'arrowright' || key === 'pagedown' || key === ' ') {
              event.preventDefault();
              goNext();
            } else if (key === 'arrowleft' || key === 'pageup') {
              event.preventDefault();
              goPrev();
            } else if (key === 'escape') {
              event.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
            }
          };

          contents.document.addEventListener('keydown', handleKeyDown);
          contents.window?.addEventListener('keydown', handleKeyDown);
          contents.on?.('destroy', () => {
            contents.document.removeEventListener('keydown', handleKeyDown);
            contents.window?.removeEventListener('keydown', handleKeyDown);
          });
        });

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
        rendition.on('rendered', () => {
          applyStyles(rendition);
          // Also re-inject CSS styles on render to ensure theme is applied
          // This is critical for production builds where content may be re-rendered
          try {
            const contents = rendition.getContents();
            contents.forEach((content: ContentLike) => {
              injectContentStyles(content);
            });
          } catch {
            // Ignore errors if contents aren't ready
          }
        });
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
        contents.forEach((content: ContentLike) => {
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
