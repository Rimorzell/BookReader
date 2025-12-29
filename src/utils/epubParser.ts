import ePub, { type Book as EpubBook, type NavItem } from 'epubjs';

export interface EpubMetadata {
  title: string;
  author: string;
  description?: string;
  cover?: ArrayBuffer;
  coverUrl?: string;
}

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

// Compress and resize cover image to reduce localStorage size
async function compressCoverImage(blobUrl: string): Promise<string | undefined> {
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 450;
  const QUALITY = 0.8;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG data URL (much smaller than PNG)
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      } catch {
        resolve(undefined);
      }
    };

    img.onerror = () => resolve(undefined);
    img.src = blobUrl;
  });
}

export async function parseEpubMetadata(arrayBuffer: ArrayBuffer): Promise<EpubMetadata> {
  const book = ePub(arrayBuffer);
  await book.ready;

  const metadata = await book.loaded.metadata;
  let coverUrl: string | undefined;

  try {
    const blobUrl = await book.coverUrl();
    if (blobUrl) {
      // Compress and convert to data URL so it persists across app restarts
      // Uses canvas to resize and JPEG compression to keep size small
      coverUrl = await compressCoverImage(blobUrl);
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    // Cover extraction failed
  }

  // Clean up
  book.destroy();

  return {
    title: metadata.title || 'Unknown Title',
    author: metadata.creator || 'Unknown Author',
    description: metadata.description,
    coverUrl,
  };
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
