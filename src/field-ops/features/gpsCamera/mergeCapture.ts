/**
 * Web port of the GPS evidence compositor.
 *
 * On mobile this used react-native-view-shot's captureRef() to flatten the photo
 * plus the <GpsOverlay> into a single JPEG. A browser has no equivalent view
 * rasteriser, so the overlay is drawn directly onto a canvas with the same
 * content and visual treatment as GpsOverlay.tsx:
 *
 *   - country flag + "city, region, country" + "GPS Map Camera" label
 *   - full reverse-geocoded address (up to 2 lines)
 *   - "Lat <5dp>deg Long <5dp>deg"
 *   - IST timestamp via the shared formatIstTimestamp()
 *   - the OSM mini-map tile for the captured point
 *
 * The stamp is therefore burned into the uploaded image exactly as before, which
 * is what makes the photo usable as evidence.
 */

import { formatIstTimestamp } from './formatIstTimestamp';
import { countryToFlag, getCountryCode } from './countryFlag';
import type { GpsLocationResult } from './useGpsLocation';

export interface MergeCaptureInput {
  /** Photo to stamp (blob:/data:/object URL from the camera or file input). */
  photoUri: string;
  location: GpsLocationResult;
  /** OSM tile URL for the mini-map, or null to omit the map (same as mobile). */
  staticMapUrl: string | null;
  capturedAt: Date;
}

export interface CaptureOptions {
  format?: 'jpg' | 'png';
  quality?: number;
  /** Longest edge of the output; the photo is downscaled to fit. */
  maxWidth?: number;
}

const DEFAULT_MAX_WIDTH = 1280;
/** Overlay metrics are relative to image width so the stamp scales with the photo. */
const OVERLAY_BASELINE_WIDTH = 1080;

const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function loadImage(uri: string, allowCrossOrigin: boolean): Promise<HTMLImageElement> {
  const img = new Image();
  if (allowCrossOrigin) img.crossOrigin = 'anonymous';
  return new Promise((resolve, reject) => {
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

/** Rounded-rect path helper (older Safari lacks ctx.roundRect). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Wraps text to maxLines, ellipsising the last line - mirrors numberOfLines on mobile. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  const consumed = lines.join(' ');
  if (consumed.length < text.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last + '…';
  }
  return lines;
}

/** Truncates one line to fit with an ellipsis (numberOfLines={1} equivalent). */
function clampLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

/**
 * Flattens the photo plus the GPS stamp into one image and returns a blob: URL.
 * Replaces mergeCapture(viewRef) from the mobile app.
 */
export async function mergeGpsCapture(
  input: MergeCaptureInput,
  options: CaptureOptions = {},
): Promise<string> {
  const { photoUri, location, staticMapUrl, capturedAt } = input;
  const { format = 'jpg', quality = 0.92, maxWidth = DEFAULT_MAX_WIDTH } = options;

  const photo = await loadImage(photoUri, /^https?:/i.test(photoUri));
  const srcW = photo.naturalWidth || photo.width;
  const srcH = photo.naturalHeight || photo.height;
  if (!srcW || !srcH) throw new Error('Photo has no dimensions.');

  const scale = Math.min(1, maxWidth / srcW);
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo, 0, 0, width, height);

  // --- overlay geometry (mirrors GpsOverlay.tsx proportions) ---
  const k = width / OVERLAY_BASELINE_WIDTH;
  const pad = Math.round(16 * k);
  const inset = Math.round(16 * k);
  const fontCaption = Math.max(10, Math.round(13 * k));
  const fontTitle = Math.max(12, Math.round(17 * k));
  const lineGap = Math.round(6 * k);
  const mapSize = Math.round(104 * k);

  const overlayWidth = width - inset * 2;
  const contentWidth = overlayWidth - pad * 2;

  const cityStateCountry =
    [location.city, location.region, location.country].filter(Boolean).join(', ') || '—';
  const flag = location.country ? countryToFlag(getCountryCode(location.country)) : '\u{1F30D}';
  const latLonLine =
    'Lat ' + location.latitude.toFixed(5) + '° Long ' + location.longitude.toFixed(5) + '°';
  const timestampLine = formatIstTimestamp(capturedAt);

  // Measure the address block before sizing the panel.
  ctx.font = fontCaption + 'px ' + SANS;
  const addressLines = wrapText(ctx, location.fullAddress ?? '', contentWidth, 2);

  const headerH = Math.round(fontTitle * 1.25);
  const bodyH =
    addressLines.length * (fontCaption + lineGap) +
    (fontCaption + lineGap) + // lat/lon
    (fontCaption + lineGap); // timestamp
  const mapBlockH = staticMapUrl ? mapSize + Math.round(4 * k) : 0;
  const overlayHeight = pad * 2 + headerH + lineGap + bodyH + mapBlockH;

  const overlayX = inset;
  const overlayY = height - inset - overlayHeight;

  // Panel: rgba(0,0,0,0.6) fill + rgba(255,255,255,0.15) hairline, radius 16 - as on mobile.
  ctx.save();
  roundRect(ctx, overlayX, overlayY, overlayWidth, overlayHeight, Math.round(16 * k));
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();
  ctx.lineWidth = Math.max(1, Math.round(1 * k));
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textBaseline = 'top';
  let cursorY = overlayY + pad;
  const textX = overlayX + pad;

  // --- header row: flag + location, "GPS Map Camera" label right-aligned ---
  ctx.font = '600 ' + Math.max(9, Math.round(fontCaption - 2)) + 'px ' + SANS;
  const labelText = 'GPS Map Camera';
  const labelWidth = ctx.measureText(labelText).width;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(labelText, overlayX + overlayWidth - pad - labelWidth, cursorY);

  ctx.font = fontTitle + 'px ' + SANS;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(flag, textX, cursorY);
  const flagWidth = ctx.measureText(flag).width + Math.round(6 * k);

  ctx.font = '600 ' + (fontCaption + 1) + 'px ' + SANS;
  const headerTextWidth = contentWidth - flagWidth - labelWidth - Math.round(8 * k);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    clampLine(ctx, cityStateCountry, Math.max(20, headerTextWidth)),
    textX + flagWidth,
    cursorY + Math.round((fontTitle - fontCaption) / 2),
  );
  cursorY += headerH + lineGap;

  // --- address (up to 2 lines) ---
  ctx.font = fontCaption + 'px ' + SANS;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const line of addressLines) {
    ctx.fillText(line, textX, cursorY);
    cursorY += fontCaption + lineGap;
  }

  // --- coordinates ---
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(latLonLine, textX, cursorY);
  cursorY += fontCaption + lineGap;

  // --- IST timestamp ---
  ctx.fillText(clampLine(ctx, timestampLine, contentWidth), textX, cursorY);
  cursorY += fontCaption + lineGap;
  ctx.restore();

  // --- mini-map tile ---
  if (staticMapUrl) {
    try {
      const mapImg = await loadImage(staticMapUrl, true);
      ctx.save();
      roundRect(ctx, textX, cursorY, contentWidth, mapSize, Math.round(8 * k));
      ctx.clip();
      // cover-fit the square tile into the wide strip
      const tileScale = Math.max(contentWidth / mapImg.width, mapSize / mapImg.height);
      const drawW = mapImg.width * tileScale;
      const drawH = mapImg.height * tileScale;
      ctx.drawImage(
        mapImg,
        textX + (contentWidth - drawW) / 2,
        cursorY + (mapSize - drawH) / 2,
        drawW,
        drawH,
      );
      ctx.restore();
    } catch {
      // Tile unavailable (offline or blocked): keep the rest of the stamp, as on mobile.
    }
  }

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, quality);
  return URL.createObjectURL(blob);
}
