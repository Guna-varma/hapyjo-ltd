/**
 * Browser stand-in for the slice of expo-file-system the app uses when exporting.
 *
 * The mobile export flow is: build a string (CSV/PDF), write it to a path under
 * documentDirectory, then hand that path to Sharing.shareAsync(). A browser has no
 * writable filesystem, so writes land in an in-memory store keyed by the same
 * pseudo-path, and lib/sharing.ts turns that entry into a real download (or a Web
 * Share) when the path is shared.
 *
 * Keeping the same API shape means the export code in ReportsScreen and
 * SurveysScreen ports without any change to its logic.
 */

/** Pseudo-directories so `${documentDirectory}${filename}` still produces a key. */
export const documentDirectory = 'hapyjo-export://documents/';
export const cacheDirectory = 'hapyjo-export://cache/';

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
} as const;

export type EncodingTypeValue = (typeof EncodingType)[keyof typeof EncodingType];

export interface VirtualFile {
  content: string;
  encoding: EncodingTypeValue;
}

/** Written files awaiting a share/download. Cleared once consumed. */
const virtualFiles = new Map<string, VirtualFile>();

/** True for a path produced by this shim. */
export function isVirtualPath(path: string): boolean {
  return path.startsWith('hapyjo-export://');
}

/** Filename portion of a virtual path, used as the download name. */
export function virtualFileName(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(slash + 1) : path;
}

export function readVirtualFile(path: string): VirtualFile | undefined {
  return virtualFiles.get(path);
}

export function deleteVirtualFile(path: string): void {
  virtualFiles.delete(path);
}

/** Browser equivalent of FileSystem.writeAsStringAsync. */
export async function writeAsStringAsync(
  path: string,
  content: string,
  options?: { encoding?: EncodingTypeValue },
): Promise<void> {
  virtualFiles.set(path, {
    content,
    encoding: options?.encoding ?? EncodingType.UTF8,
  });
}

/** Browser equivalent of FileSystem.readAsStringAsync for files this shim wrote. */
export async function readAsStringAsync(
  path: string,
  _options?: { encoding?: EncodingTypeValue },
): Promise<string> {
  const file = virtualFiles.get(path);
  if (file) return file.content;
  // Not one of ours: it is a blob:/data:/http(s): URI, which fetch can read.
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Read failed: ${res.status}`);
  return await res.text();
}

/** Converts a stored virtual file into a Blob for download or sharing. */
export function virtualFileToBlob(file: VirtualFile, mimeType: string): Blob {
  if (file.encoding === EncodingType.Base64) {
    const binary = atob(file.content.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  }
  // Prepend a BOM so Excel opens exported CSV as UTF-8 rather than ANSI.
  const prefix = mimeType === 'text/csv' ? '﻿' : '';
  return new Blob([prefix + file.content], { type: mimeType });
}
