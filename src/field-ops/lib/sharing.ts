/**
 * Browser stand-in for expo-sharing.
 *
 * shareAsync() receives either a virtual path written by lib/fileSystem (CSV / PDF
 * exports) or a blob:/data:/http(s): URI. It resolves that to a Blob and then:
 *   1. uses the Web Share API with files when the browser supports it (mobile),
 *      which is the closest equivalent to the native share sheet; otherwise
 *   2. triggers a download, which is how a desktop browser "shares" a file.
 *
 * Either way the user ends up with the exported file, so the export workflow is
 * preserved rather than removed.
 */

import { PRINT_COMPLETED_URI } from '@/field-ops/lib/surveyPdf';
import {
  isVirtualPath,
  readVirtualFile,
  deleteVirtualFile,
  virtualFileName,
  virtualFileToBlob,
} from '@/field-ops/lib/fileSystem';

export interface SharingOptions {
  mimeType?: string;
  dialogTitle?: string;
  UTI?: string;
}

/** Sharing is always "available": there is at least the download path. */
export async function isAvailableAsync(): Promise<boolean> {
  return typeof document !== 'undefined';
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has been processed.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'text/csv') return '.csv';
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  return '';
}

/** True when the browser can share this file through the OS share sheet. */
function canShareFiles(files: File[]): boolean {
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: unknown) => Promise<void>;
  };
  return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files });
}

/**
 * Browser equivalent of Sharing.shareAsync.
 * Resolves once the share sheet closes, or once the download has been initiated.
 */
export async function shareAsync(uri: string, options: SharingOptions = {}): Promise<void> {
  const mimeType = options.mimeType ?? 'application/octet-stream';

  // The survey PDF is produced through the browser's print dialog, which already
  // hands the document to the user, so there is nothing left to share.
  if (uri === PRINT_COMPLETED_URI) return;

  let blob: Blob;
  let filename: string;

  if (isVirtualPath(uri)) {
    const file = readVirtualFile(uri);
    if (!file) throw new Error('Export file is no longer available.');
    blob = virtualFileToBlob(file, mimeType);
    filename = virtualFileName(uri);
    deleteVirtualFile(uri);
  } else {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`Could not read file to share: ${res.status}`);
    blob = new Blob([await res.arrayBuffer()], { type: mimeType });
    const fromUri = uri.split('?')[0].split('/').pop() || 'hapyjo-export';
    filename = fromUri.includes('.') ? fromUri : fromUri + extensionForMime(mimeType);
  }

  if (!filename.includes('.')) filename += extensionForMime(mimeType);

  const file = new File([blob], filename, { type: mimeType });
  if (canShareFiles([file])) {
    try {
      await (navigator as Navigator & { share: (d: unknown) => Promise<void> }).share({
        files: [file],
        title: options.dialogTitle,
      });
      return;
    } catch (e) {
      // AbortError means the user dismissed the sheet — honour that, do not also download.
      if (e instanceof Error && e.name === 'AbortError') return;
      // Any other failure falls through to a download.
    }
  }

  triggerDownload(blob, filename);
}
