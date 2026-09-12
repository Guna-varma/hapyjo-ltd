/**
 * Browser replacement for expo-image-picker, with the same call surface the app
 * uses so every capture flow (trip start/end photos, issue photos, GPS camera,
 * work progress) ports unchanged:
 *
 *   requestCameraPermissionsAsync / requestMediaLibraryPermissionsAsync
 *   launchCameraAsync / launchImageLibraryAsync
 *
 * Implementation: a transient <input type="file" accept="image/*">. Adding
 * `capture="environment"` makes a mobile browser open the rear camera directly,
 * which is the real device camera — so EXIF (including GPS written by the camera
 * app) survives, exactly as the mobile picker provided. EXIF is decoded with
 * lib/readExif so `asset.exif` keeps the shape parseExifGps() expects.
 *
 * Documented limitation: on a desktop browser `capture` is advisory — if no
 * camera is attached the OS file chooser opens instead. There is no web API to
 * force a camera-only flow without discarding EXIF (a getUserMedia canvas frame
 * carries none), so preserving GPS evidence is prioritised.
 */

import { readExifFromFile, type ExifRecord } from '@/field-ops/lib/readExif';

export interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  exif?: ExifRecord | null;
  /** Retained so callers can upload the original bytes without re-fetching. */
  file?: File;
}

export interface ImagePickerResult {
  canceled: boolean;
  assets: ImagePickerAsset[];
}

export interface ImagePickerOptions {
  /** Accepted for API compatibility; only images are ever requested. */
  mediaTypes?: unknown;
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  quality?: number;
  exif?: boolean;
  selectionLimit?: number;
}

export interface PermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
}

const GRANTED: PermissionResponse = { status: 'granted', granted: true };

/**
 * Browsers have no separate up-front camera permission for a file input — the
 * chooser/camera is gated by the user's own click. Report granted so the existing
 * permission checks pass through; an actual refusal surfaces as a cancelled pick.
 */
export async function requestCameraPermissionsAsync(): Promise<PermissionResponse> {
  return GRANTED;
}

export async function getCameraPermissionsAsync(): Promise<PermissionResponse> {
  return GRANTED;
}

/** No media-library permission concept on the web; the file chooser is the gate. */
export async function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse> {
  return GRANTED;
}

export async function getMediaLibraryPermissionsAsync(): Promise<PermissionResponse> {
  return GRANTED;
}

/** Reads intrinsic dimensions of a picked image; zeroes if it cannot be decoded. */
function readDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = uri;
  });
}

async function toAsset(file: File, wantExif: boolean): Promise<ImagePickerAsset> {
  const uri = URL.createObjectURL(file);
  const { width, height } = await readDimensions(uri);
  return {
    uri,
    width,
    height,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'image/jpeg',
    exif: wantExif ? await readExifFromFile(file) : null,
    file,
  };
}

/**
 * Renders a transient file input and resolves with the chosen images.
 * `useCamera` adds capture="environment" so mobile browsers open the rear camera.
 */
function pickImages(
  useCamera: boolean,
  multiple: boolean,
): Promise<File[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    if (useCamera) input.setAttribute('capture', 'environment');
    input.style.display = 'none';

    let settled = false;
    const finish = (files: File[]) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      input.remove();
      resolve(files);
    };
    /**
     * Cancellation: modern browsers fire `cancel` on the input when the chooser or
     * camera is dismissed, which is the only reliable signal. Older browsers never
     * fire anything, so as a fallback we treat the window regaining focus (or the
     * page becoming visible again after the camera app) with no selection as a
     * cancel — after a generous delay, because on phones `change` can arrive well
     * after focus while a full-resolution capture is still being written.
     */
    // TS narrows `input` to never after an `in` check on a known DOM type; test the prototype instead.
    const supportsCancelEvent = 'oncancel' in HTMLInputElement.prototype;
    const CANCEL_FALLBACK_DELAY_MS = 2500;
    const scheduleFallbackCancel = () => {
      if (supportsCancelEvent) return;
      setTimeout(() => {
        if (!settled && (input.files?.length ?? 0) === 0) finish([]);
      }, CANCEL_FALLBACK_DELAY_MS);
    };
    const onFocus = () => scheduleFallbackCancel();
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleFallbackCancel();
    };

    input.addEventListener('change', () => finish(Array.from(input.files ?? [])));
    input.addEventListener('cancel', () => finish([]));
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    document.body.appendChild(input);
    input.click();
  });
}

/** Browser equivalent of ImagePicker.launchCameraAsync. */
export async function launchCameraAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  const files = await pickImages(true, false);
  if (files.length === 0) return { canceled: true, assets: [] };
  return {
    canceled: false,
    assets: [await toAsset(files[0], options.exif !== false)],
  };
}

/** Browser equivalent of ImagePicker.launchImageLibraryAsync. */
export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  const multiple = options.allowsMultipleSelection === true;
  const files = await pickImages(false, multiple);
  if (files.length === 0) return { canceled: true, assets: [] };
  const limit =
    multiple && options.selectionLimit && options.selectionLimit > 0
      ? options.selectionLimit
      : multiple
        ? files.length
        : 1;
  const wantExif = options.exif !== false;
  const assets: ImagePickerAsset[] = [];
  for (const file of files.slice(0, limit)) {
    assets.push(await toAsset(file, wantExif));
  }
  return { canceled: false, assets };
}
