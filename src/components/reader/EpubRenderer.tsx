import { forwardRef, useEffect, useRef, useCallback, useImperativeHandle, useState, useMemo } from 'react';
import ePub, { type Book as EpubBook, type Rendition, type Location } from 'epubjs';
import { useReaderStore, useSettingsStore, useLibraryStore, toast } from '../../stores';
import type { Book, TocItem, HighlightColor } from '../../types';
import { getTableOfContents } from '../../utils/epubParser';
import { readBookFile } from '../../utils/fileSystem';
import { getThemeColors } from '../../constants';
import { HighlightPopup } from './HighlightPopup';

interface SelectionInfo {
  text: string;
  cfiRange: string;
  position: { x: number; y: number };
  existingHighlightId?: string;
}

interface EpubRendererProps {
  book: Book;
  onTocLoaded: (toc: TocItem[]) => void;
}

type AnnotatedRendition = Rendition & {
  annotations: {
    add: (...args: unknown[]) => void;
    remove: (...args: unknown[]) => void;
  };
  on: (event: string, callback: (...args: unknown[]) => void) => void;
};

export const EpubRenderer = forwardRef<EpubRendererRef, EpubRendererProps>(
  ({ book, onTocLoaded }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const epubRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const HIGHLIGHT_COLORS = useMemo<Record<HighlightColor, string>>(
    () => ({
      yellow: 'rgba(254, 240, 138, 0.5)',
      green: 'rgba(187, 247, 208, 0.5)',
      blue: 'rgba(191, 219, 254, 0.5)',
      pink: 'rgba(251, 207, 232, 0.5)',
      purple: 'rgba(221, 214, 254, 0.5)',
    }),
    []
  );

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
  const { updateReadingProgress, addHighlight, getBookHighlights, removeHighlight } = useLibraryStore();
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

  const getAnnotatedRendition = useCallback(() => {
    return renditionRef.current as AnnotatedRendition | null;
  }, []);

  const removeAnnotation = useCallback((rendition: AnnotatedRendition, cfi: string) => {
    try {
      rendition.annotations.remove(cfi, 'highlight', 'hl');
    } catch {
      // Ignore missing annotations
    }
  }, []);

  const clearBrowserSelection = useCallback(() => {
    try {
      const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
      iframe?.contentWindow?.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
  }, []);

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

  const handleRemoveHighlight = useCallback(() => {
    const rendition = getAnnotatedRendition();
    if (!selection || !rendition || !selection.existingHighlightId) return;

    const existing = getBookHighlights(bookIdRef.current).find((h) => h.id === selection.existingHighlightId);
    const targetCfi = existing?.startLocation || selection.cfiRange;

    removeAnnotation(rendition, targetCfi);
    removeAnnotation(rendition, selection.cfiRange);
    removeHighlight(selection.existingHighlightId);
    clearBrowserSelection();
    setSelection(null);
  }, [clearBrowserSelection, getAnnotatedRendition, getBookHighlights, removeAnnotation, removeHighlight, selection]);

  // Handle highlighting selected text
  const handleHighlight = useCallback((color: HighlightColor) => {
    const rendition = getAnnotatedRendition();
    if (!selection || !rendition) return;

    // If the same color is chosen for an existing highlight, treat as removal
    if (selection.existingHighlightId) {
      const existing = getBookHighlights(bookIdRef.current).find(
        (h) => h.id === selection.existingHighlightId
      );
      if (existing?.color === color) {
        handleRemoveHighlight();
        return;
      }
      removeHighlight(selection.existingHighlightId);
    }

    addHighlight({
      bookId: bookIdRef.current,
      text: selection.text,
      startLocation: selection.cfiRange,
      endLocation: selection.cfiRange,
      color,
    });

    removeAnnotation(rendition, selection.cfiRange);
    rendition.annotations.add(
      'highlight',
      selection.cfiRange,
      {},
      undefined,
      'hl',
      { fill: HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow }
    );

    clearBrowserSelection();
    setSelection(null);
  }, [
    HIGHLIGHT_COLORS,
    addHighlight,
    clearBrowserSelection,
    getAnnotatedRendition,
    getBookHighlights,
    handleRemoveHighlight,
    removeHighlight,
    selection,
  ]);

  // Apply existing highlights when rendition is ready
  const applyExistingHighlights = useCallback((rendition: AnnotatedRendition) => {
    const highlights = getBookHighlights(bookIdRef.current);

    highlights.forEach((highlight) => {
      try {
        rendition.annotations.remove(highlight.startLocation);
        rendition.annotations.add(
          'highlight',
          highlight.startLocation,
          {},
          undefined,
          'hl',
          { fill: HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow }
        );
      } catch {
        // Ignore invalid CFI ranges
      }
    });
  }, [getBookHighlights, HIGHLIGHT_COLORS]);

  // Keep rendition annotations in sync with store updates (additions/removals)
  useEffect(() => {
    let previousHighlights = useLibraryStore
      .getState()
      .highlights.filter((h) => h.bookId === bookIdRef.current);

    const unsubscribe = useLibraryStore.subscribe((state) => {
      const highlights = state.highlights.filter((h) => h.bookId === bookIdRef.current);
      const rendition = getAnnotatedRendition();
      if (!rendition) {
        previousHighlights = highlights;
        return;
      }

      const prevMap = new Map(previousHighlights.map((h) => [h.id, h]));
      const nextMap = new Map(highlights.map((h) => [h.id, h]));

      // Remove deleted highlights
      prevMap.forEach((highlight, id) => {
        if (!nextMap.has(id)) {
          try {
            rendition.annotations.remove(highlight.startLocation);
          } catch {
            // Ignore annotation errors
          }
        }
      });

      // Add or update new/changed highlights
      nextMap.forEach((highlight, id) => {
        const prev = prevMap.get(id);
        if (!prev || prev.startLocation !== highlight.startLocation || prev.color !== highlight.color) {
          try {
            rendition.annotations.remove(highlight.startLocation);
          } catch {
            // Ignore missing annotations
          }
          try {
            rendition.annotations.add(
              'highlight',
              highlight.startLocation,
              {},
              undefined,
              'hl',
              { fill: HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow }
            );
          } catch {
            // Ignore invalid CFI ranges
          }
        }
      });

      previousHighlights = highlights;
    });

    return unsubscribe;
  }, [getAnnotatedRendition, HIGHLIGHT_COLORS]);

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
        rendition.on('relocated', handleLocationChange as unknown as (...args: unknown[]) => void);
        rendition.on('rendered', () => applyStyles(rendition));

        // Handle text selection for highlighting
        rendition.on('selected', ((cfiRange: string, contents: { window: Window }) => {
          const selectedText = contents.window.getSelection()?.toString().trim();
          if (selectedText && selectedText.length > 0) {
            // Get selection position for popup
            const selection = contents.window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();

              // Get iframe position to calculate absolute position
              const iframe = containerRef.current?.querySelector('iframe');
              const iframeRect = iframe?.getBoundingClientRect() || { left: 0, top: 0 };

              const existing = getBookHighlights(bookIdRef.current).find(
                (h) => h.startLocation === cfiRange
              );

              setSelection({
                text: selectedText,
                cfiRange,
                existingHighlightId: existing?.id,
                position: {
                  x: iframeRect.left + rect.left + rect.width / 2,
                  y: iframeRect.top + rect.top,
                },
              });
            }
          }
        }) as unknown as (...args: unknown[]) => void);

        // Apply existing highlights
        applyExistingHighlights(rendition as AnnotatedRendition);

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
    <>
      <div
        ref={containerRef}
        className="w-full h-full reader-content"
        style={{
          backgroundColor: getThemeColors(readerSettings.theme).background,
        }}
      />
      {selection && (
        <HighlightPopup
          position={selection.position}
          onHighlight={handleHighlight}
          onRemove={handleRemoveHighlight}
          canRemove={!!selection.existingHighlightId}
          onClose={() => {
            clearBrowserSelection();
            setSelection(null);
          }}
        />
      )}
    </>
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
