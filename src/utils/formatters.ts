export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return 'Less than a minute';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  if (days > 0) {
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  return 'Just now';
}

export function formatTimeRemaining(
  currentProgress: number,
  totalPages: number,
  averagePageTimeSeconds: number
): string {
  if (currentProgress >= 100 || averagePageTimeSeconds === 0) return 'Complete';

  const remainingPages = Math.ceil((100 - currentProgress) / 100 * totalPages);
  const remainingSeconds = remainingPages * averagePageTimeSeconds;

  return formatReadingTime(remainingSeconds);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*]/g, '-');
}

export function generateExportFilename(bookTitle: string, type: 'annotations' | 'highlights' | 'notes'): string {
  const sanitized = sanitizeFilename(bookTitle);
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}-${type}-${date}.md`;
}

export function formatAnnotationsAsMarkdown(
  bookTitle: string,
  bookAuthor: string,
  highlights: { text: string; note?: string; color: string; dateCreated: number }[],
  bookmarks: { displayText?: string; note?: string; dateCreated: number }[]
): string {
  let markdown = `# ${bookTitle}\n`;
  markdown += `*by ${bookAuthor}*\n\n`;
  markdown += `Exported on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}\n\n`;

  if (highlights.length > 0) {
    markdown += `## Highlights (${highlights.length})\n\n`;
    highlights.forEach((h, i) => {
      markdown += `### ${i + 1}. ${h.color.charAt(0).toUpperCase() + h.color.slice(1)} Highlight\n`;
      markdown += `> ${h.text}\n\n`;
      if (h.note) {
        markdown += `**Note:** ${h.note}\n\n`;
      }
      markdown += `*${formatDate(h.dateCreated)}*\n\n---\n\n`;
    });
  }

  if (bookmarks.length > 0) {
    markdown += `## Bookmarks (${bookmarks.length})\n\n`;
    bookmarks.forEach((b, i) => {
      markdown += `### Bookmark ${i + 1}\n`;
      if (b.displayText) {
        markdown += `> ${b.displayText}\n\n`;
      }
      if (b.note) {
        markdown += `**Note:** ${b.note}\n\n`;
      }
      markdown += `*${formatDate(b.dateCreated)}*\n\n---\n\n`;
    });
  }

  return markdown;
}
