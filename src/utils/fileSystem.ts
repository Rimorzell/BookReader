import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { FileType } from '../types';

export interface ImportedFile {
  name: string;
  path: string;
  data: Uint8Array;
  type: FileType;
}

export async function openFileDialog(): Promise<ImportedFile | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'E-Books',
          extensions: ['epub', 'pdf'],
        },
      ],
    });

    if (!selected) return null;

    // Tauri v2 dialog returns string | string[] | null
    const path = selected as string;
    const data = await readFile(path);
    const extension = path.split('.').pop()?.toLowerCase();
    const name = path.split(/[/\\]/).pop() || 'Unknown';

    if (extension !== 'epub' && extension !== 'pdf') {
      throw new Error('Unsupported file type');
    }

    return {
      name,
      path,
      data,
      type: extension as FileType,
    };
  } catch (error) {
    console.error('Failed to open file:', error);
    return null;
  }
}

export async function openMultipleFilesDialog(): Promise<ImportedFile[]> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'E-Books',
          extensions: ['epub', 'pdf'],
        },
      ],
    });

    if (!selected) return [];

    // Tauri v2 dialog returns string | string[] | null
    const paths = Array.isArray(selected) ? selected : [selected];

    const files: ImportedFile[] = [];

    for (const path of paths) {
      const data = await readFile(path);
      const extension = path.split('.').pop()?.toLowerCase();
      const name = path.split(/[/\\]/).pop() || 'Unknown';

      if (extension === 'epub' || extension === 'pdf') {
        files.push({
          name,
          path,
          data,
          type: extension,
        });
      }
    }

    return files;
  } catch (error) {
    console.error('Failed to open files:', error);
    return [];
  }
}

export async function readBookFile(path: string): Promise<Uint8Array> {
  return await readFile(path);
}

export async function ensureAppDataDir(): Promise<void> {
  const coversDirExists = await exists('covers', { baseDir: BaseDirectory.AppData });
  if (!coversDirExists) {
    await mkdir('covers', { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function saveCoverImage(
  bookId: string,
  imageData: Uint8Array
): Promise<string> {
  await ensureAppDataDir();
  const coverPath = `covers/${bookId}.jpg`;
  await writeFile(coverPath, imageData, { baseDir: BaseDirectory.AppData });
  return coverPath;
}

export async function exportAnnotations(
  content: string,
  defaultName: string
): Promise<boolean> {
  try {
    const path = await save({
      defaultPath: defaultName,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] },
      ],
    });

    if (!path) return false;

    const encoder = new TextEncoder();
    await writeFile(path, encoder.encode(content));
    return true;
  } catch (error) {
    console.error('Failed to export:', error);
    return false;
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidBookFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === 'epub' || ext === 'pdf';
}
