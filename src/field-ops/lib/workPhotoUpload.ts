/**
 * Web port: identical bucket (work-photos), work/ prefix, size thresholds,
 * compression ladder, thumbnail generation, retry-once and public API.
 */
import { supabase } from '@/field-ops/lib/supabase';
import { getUriSizeInBytes } from '@/field-ops/lib/compressIssueImage';
import { uriToArrayBuffer } from '@/field-ops/lib/uriToArrayBuffer';
import * as ImageManipulator from '@/field-ops/lib/imageManipulator';

const BUCKET = 'work-photos';
const PREFIX = 'work/';
/** Max size for trip proof photos (speedometer start/end). Lightweight: compress to 50KB. */
const MAX_PHOTO_BYTES = 50 * 1024;
const TARGET_THUMB_BYTES_MAX = 20 * 1024;
const MIN_ACCEPTED_BYTES = 30 * 1024;
const MAX_WIDTH = 1280;
const THUMB_WIDTH = 320;
const PHOTO_QUALITY = 0.45;
const PHOTO_QUALITY_LOW = 0.28;
const PHOTO_QUALITY_MIN = 0.18;
const THUMB_QUALITY = 0.5;
const MAX_WIDTH_SMALL = 800;

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heif', '.heic', '.webp']);
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/heif', 'image/heic', 'image/webp']);

function getExtension(uri: string): string {
  const q = uri.indexOf('?');
  const path = q >= 0 ? uri.slice(0, q) : uri;
  const last = path.lastIndexOf('.');
  if (last < 0) return '';
  return path.slice(last).toLowerCase();
}

/** MIME type declared inside a data: URI ("data:image/jpeg;base64,..."), or null. */
function dataUriMime(uri: string): string | null {
  const m = /^data:([^;,]+)[;,]/i.exec(uri);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Browser image sources: the picker hands the app blob: object URLs and the trip
 * screens convert them to data: URIs, neither of which carries a file extension.
 * Their MIME type is authoritative instead: data: carries it inline, and a blob:
 * URL has already been type-checked by the caller against the File's MIME type
 * (isAllowedImageFormat(uri, mimeType)) before it reaches this module.
 */
function isBrowserImageUri(uri: string): boolean {
  if (uri.startsWith('blob:')) return true;
  const mime = dataUriMime(uri);
  return mime != null && ALLOWED_MIMES.has(mime);
}

export function isAllowedImageFormat(uri: string, mimeType?: string): boolean {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') return false;
  if (mimeType != null && typeof mimeType === 'string' && ALLOWED_MIMES.has(mimeType.toLowerCase())) return true;
  if (isBrowserImageUri(uri)) return true;
  const ext = getExtension(uri);
  return ext.length > 0 && ALLOWED_EXTENSIONS.has(ext);
}

/** Reads the real MIME type of a blob:/data: URI so the bytes, not the name, decide. */
async function readUriMime(uri: string): Promise<string | null> {
  if (!uri.startsWith('blob:') && !uri.startsWith('data:')) return null;
  try {
    const blob = await fetch(uri).then((r) => r.blob());
    return blob.type ? blob.type.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function validateAndPrepareWorkPhoto(localUri: string): Promise<{ uri: string; size: number }> {
  if (!localUri || typeof localUri !== 'string' || localUri.trim() === '') {
    throw new Error('Invalid image: no file.');
  }
  if (!isAllowedImageFormat(localUri)) {
    throw new Error('Only image files are allowed (JPEG, PNG, HEIF, WebP).');
  }
  // blob:/data: URIs have no extension; verify the actual content type of the bytes.
  const actualMime = await readUriMime(localUri);
  if (actualMime && !ALLOWED_MIMES.has(actualMime)) {
    throw new Error('Only image files are allowed (JPEG, PNG, HEIF, WebP).');
  }
  const size = await getUriSizeInBytes(localUri);
  if (!Number.isFinite(size) || size < 0) {
    throw new Error('Could not read image file.');
  }
  if (size === 0) {
    throw new Error('Image file is empty.');
  }
  // Keep if already within 30–50 KB; otherwise compress to max 50 KB (lightweight).
  if (size <= MAX_PHOTO_BYTES && size >= MIN_ACCEPTED_BYTES) {
    return { uri: localUri, size };
  }
  if (size < MIN_ACCEPTED_BYTES) {
    return { uri: localUri, size };
  }
  // Over 50 KB: compress to max 50 KB (trip proof photos stay lightweight).
  return compressToMaxSize(localUri);
}

async function compressToMaxSize(localUri: string): Promise<{ uri: string; size: number }> {
  const attempts: { width: number; quality: number }[] = [
    { width: MAX_WIDTH, quality: PHOTO_QUALITY },
    { width: MAX_WIDTH, quality: PHOTO_QUALITY_LOW },
    { width: MAX_WIDTH_SMALL, quality: PHOTO_QUALITY_LOW },
    { width: MAX_WIDTH_SMALL, quality: PHOTO_QUALITY_MIN },
  ];
  let result: { uri: string } | null = null;
  for (const { width, quality } of attempts) {
    const res = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: false }
    );
    if (!res.uri) continue;
    result = res;
    const outSize = await getUriSizeInBytes(res.uri);
    if (outSize <= MAX_PHOTO_BYTES) break;
  }
  if (!result?.uri) throw new Error('Compression produced no output');
  const finalSize = await getUriSizeInBytes(result.uri);
  return { uri: result.uri, size: finalSize };
}

export async function generateThumbnail(localUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: THUMB_WIDTH } }],
    { compress: THUMB_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: false }
  );
  if (!result.uri) throw new Error('Thumbnail failed');
  return result.uri;
}

async function uploadOnce(
  photoPath: string,
  thumbPath: string,
  photoBuf: ArrayBuffer,
  thumbBuf: ArrayBuffer
): Promise<{ photoUrl: string; thumbnailUrl: string }> {
  const { error: e1 } = await supabase.storage.from(BUCKET).upload(photoPath, photoBuf, { contentType: 'image/jpeg', upsert: true });
  if (e1) throw new Error(`Upload failed: ${e1.message}`);
  const { error: e2 } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuf, { contentType: 'image/jpeg', upsert: true });
  if (e2) throw new Error(`Thumbnail upload failed: ${e2.message}`);
  const { data: photoUrlData } = supabase.storage.from(BUCKET).getPublicUrl(photoPath);
  const { data: thumbUrlData } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
  return { photoUrl: photoUrlData.publicUrl, thumbnailUrl: thumbUrlData.publicUrl };
}

/** Retry once on network failure. Upload before DB write; no orphan DB records. */
export async function uploadWorkPhoto(photoId: string, photoUri: string, thumbUri: string): Promise<{ photoUrl: string; thumbnailUrl: string }> {
  const photoPath = `${PREFIX}${photoId}/photo-${Date.now()}.jpg`;
  const thumbPath = `${PREFIX}${photoId}/thumb-${Date.now()}.jpg`;
  const [photoBuf, thumbBuf] = await Promise.all([uriToArrayBuffer(photoUri), uriToArrayBuffer(thumbUri)]);
  const isNetworkErr = (e: Error) => /fetch|network|connection|failed/i.test(e.message);
  try {
    return await uploadOnce(photoPath, thumbPath, photoBuf, thumbBuf);
  } catch (first) {
    if (isNetworkErr(first instanceof Error ? first : new Error(String(first)))) {
      return await uploadOnce(photoPath, thumbPath, photoBuf, thumbBuf);
    }
    throw first;
  }
}
