export type ReadingStatus = 'reading' | 'finished' | 'want-to-read';
export type FileType = 'epub' | 'pdf';
export type Theme = 'light' | 'sepia' | 'dark' | 'black';
export type TextAlign = 'left' | 'justify';
export type PageAnimation = 'slide' | 'fade' | 'none';
export type ViewMode = 'paginated' | 'scroll';

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverPath?: string;
  filePath: string;
  fileType: FileType;
  dateAdded: number;
  lastOpened?: number;
  currentLocation?: string; // EPUB CFI or page number
  totalLocations?: number;
  progress: number; // 0-100
  readingTime: number; // seconds
  status: ReadingStatus;
  collectionIds: string[];
  tags: string[];
}

export interface Bookmark {
  id: string;
  bookId: string;
  location: string; // CFI or page number
  dateCreated: number;
  note?: string;
  displayText?: string; // Preview of the bookmarked content
}

export interface Highlight {
  id: string;
  bookId: string;
  text: string;
  startLocation: string;
  endLocation: string;
  color: HighlightColor;
  note?: string;
  dateCreated: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface Collection {
  id: string;
  name: string;
  bookIds: string[];
  dateCreated: number;
  sortOrder: number;
}

export interface ReaderSettings {
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  marginHorizontal: number;
  marginVertical: number;
  maxWidth: number;
  paragraphSpacing: number;
  pageAnimation: PageAnimation;
  viewMode: ViewMode;
  showProgress: boolean;
  twoPageSpread: boolean;
}

export interface AppSettings {
  reader: ReaderSettings;
  library: {
    sortBy: 'dateAdded' | 'lastOpened' | 'title' | 'author' | 'progress';
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
  };
  startupBehavior: 'library' | 'lastBook';
  customThemes: CustomTheme[];
}

export interface CustomTheme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface ReadingStats {
  totalReadingTime: number;
  booksFinished: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: number;
}

// Default settings
export const defaultReaderSettings: ReaderSettings = {
  theme: 'light',
  fontFamily: 'Georgia',
  fontSize: 18,
  lineHeight: 1.8,
  letterSpacing: 0,
  textAlign: 'left',
  marginHorizontal: 60,
  marginVertical: 40,
  maxWidth: 800,
  paragraphSpacing: 1.2,
  pageAnimation: 'slide',
  viewMode: 'paginated',
  showProgress: true,
  twoPageSpread: false,
};

export const defaultAppSettings: AppSettings = {
  reader: defaultReaderSettings,
  library: {
    sortBy: 'lastOpened',
    sortOrder: 'desc',
    viewMode: 'grid',
  },
  startupBehavior: 'library',
  customThemes: [],
};

export const fontFamilies = [
  { name: 'Georgia', value: 'Georgia, serif', category: 'serif' },
  { name: 'Palatino', value: 'Palatino Linotype, Palatino, serif', category: 'serif' },
  { name: 'Times New Roman', value: 'Times New Roman, Times, serif', category: 'serif' },
  { name: 'Charter', value: 'Charter, Georgia, serif', category: 'serif' },
  { name: 'Literata', value: 'Literata, Georgia, serif', category: 'serif' },
  { name: 'System UI', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', category: 'sans-serif' },
  { name: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: 'sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'sans-serif' },
  { name: 'SF Mono', value: '"SF Mono", Menlo, Monaco, monospace', category: 'monospace' },
];

export const highlightColors: { name: HighlightColor; hex: string }[] = [
  { name: 'yellow', hex: '#fef08a' },
  { name: 'green', hex: '#bbf7d0' },
  { name: 'blue', hex: '#bfdbfe' },
  { name: 'pink', hex: '#fbcfe8' },
  { name: 'purple', hex: '#ddd6fe' },
];

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}
