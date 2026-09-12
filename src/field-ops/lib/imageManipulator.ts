/**
 * Browser image manipulation with the same surface the app used from
 * expo-image-manipulator, so the compression pipelines port unchanged.
 *
 * Implemented with Canvas: decode -> resize -> re-encode at a quality factor,
 * returning a blob: URL. Callers then read it with fetch(), exactly as the
 * mobile code already did on its web branch.
 */

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
} as const;

export type SaveFormatValue = (typeof SaveFormat)[keyof typeof SaveFormat];

export interface ResizeAction {
  resize: { width?: number; height?: number };
}

export interface ManipulateOptions {
  /** 0..1 encoder quality, same meaning as expo's `compress`. */
  compress?: number;
  format?: SaveFormatValue;
  base64?: boolean;
}

export interface ManipulateResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

function mimeFor(format: SaveFormatValue): string {
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** Decodes any browser-loadable image source (blob:, data:, http(s):, object URL). */
async function loadImage(uri: string): Promise<HTMLImageElement> {
  const img = new Image();
  // Needed so a remote image can be drawn to a canvas without tainting it.
  if (/^https?:/i.test(uri)) img.crossOrigin = 'anonymous';
  img.decoding = 'sync';
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = uri;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed.'))),
      mime,
      quality,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      // Strip the "data:<mime>;base64," prefix to match expo's base64 output.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read encoded image.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Browser equivalent of ImageManipulator.manipulateAsync.
 * Supports the resize action the app uses; other actions are ignored rather than
 * failing, which keeps behaviour predictable if call sites grow.
 */
export async function manipulateAsync(
  uri: string,
  actions: ResizeAction[] = [],
  options: ManipulateOptions = {},
): Promise<ManipulateResult> {
  const { compress = 1, format = SaveFormat.JPEG, base64 = false } = options;
  const img = await loadImage(uri);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;
  if (!targetWidth || !targetHeight) throw new Error('Image has no dimensions.');

  for (const action of actions) {
    const resize = action?.resize;
    if (!resize) continue;
    const aspect = targetWidth / targetHeight;
    if (resize.width != null && resize.height != null) {
      targetWidth = Math.max(1, Math.round(resize.width));
      targetHeight = Math.max(1, Math.round(resize.height));
    } else if (resize.width != null) {
      // Never upscale: matches expo behaviour for the app's downscale-only usage.
      targetWidth = Math.max(1, Math.round(Math.min(resize.width, targetWidth)));
      targetHeight = Math.max(1, Math.round(targetWidth / aspect));
    } else if (resize.height != null) {
      targetHeight = Math.max(1, Math.round(Math.min(resize.height, targetHeight)));
      targetWidth = Math.max(1, Math.round(targetHeight * aspect));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // JPEG has no alpha; paint white so transparent PNGs do not become black.
  if (format === SaveFormat.JPEG) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, mimeFor(format), Math.min(Math.max(compress, 0), 1));
  return {
    uri: URL.createObjectURL(blob),
    width: targetWidth,
    height: targetHeight,
    ...(base64 ? { base64: await blobToBase64(blob) } : {}),
  };
}
