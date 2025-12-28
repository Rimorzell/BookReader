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

async function blobUrlToDataUrl(blobUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function parseEpubMetadata(arrayBuffer: ArrayBuffer): Promise<EpubMetadata> {
  const book = ePub(arrayBuffer);
  await book.ready;

  const metadata = await book.loaded.metadata;
  let coverUrl: string | undefined;

  try {
    const blobUrl = await book.coverUrl();
    if (blobUrl) {
      // Convert blob URL to data URL so it persists across app restarts
      coverUrl = await blobUrlToDataUrl(blobUrl);
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
