/**
 * Minimal JPEG EXIF reader for the tags the app actually consumes.
 *
 * Expo's ImagePicker returned a parsed `exif` object on each asset, which
 * lib/workPhotoExif.parseExifGps() reads (GPSLatitude / GPSLatitudeRef /
 * GPSLongitude / GPSLongitudeRef, plus DateTimeOriginal). A browser File carries
 * the raw bytes instead, so this extracts those same tags in the same shape —
 * keeping GPS-embedded-in-photo working on web, including photos produced by
 * third-party camera apps.
 *
 * Only the GPS IFD and DateTimeOriginal are decoded; anything else is ignored,
 * and any malformed structure yields an empty record rather than throwing.
 */

/** EXIF GPS tag ids (GPS IFD). */
const GPS_LATITUDE_REF = 0x0001;
const GPS_LATITUDE = 0x0002;
const GPS_LONGITUDE_REF = 0x0003;
const GPS_LONGITUDE = 0x0004;
const GPS_ALTITUDE = 0x0006;
const GPS_TIMESTAMP = 0x0007;

/** IFD0 / ExifIFD tag ids. */
const EXIF_IFD_POINTER = 0x8769;
const GPS_IFD_POINTER = 0x8825;
const DATE_TIME_ORIGINAL = 0x9003;

const TYPE_BYTE = 1;
const TYPE_ASCII = 2;
const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;
const TYPE_SLONG = 9;
const TYPE_SRATIONAL = 10;

const TYPE_SIZES: Record<number, number> = {
  [TYPE_BYTE]: 1,
  [TYPE_ASCII]: 1,
  [TYPE_SHORT]: 2,
  [TYPE_LONG]: 4,
  [TYPE_RATIONAL]: 8,
  [TYPE_SLONG]: 4,
  [TYPE_SRATIONAL]: 8,
};

/** A rational as produced here — parseExifGps accepts this shape directly. */
export interface ExifRational {
  numerator: number;
  denominator: number;
}

export type ExifRecord = Record<string, unknown>;

/** Locates the TIFF header inside a JPEG's APP1/Exif segment. Returns -1 when absent. */
function findTiffOffset(view: DataView): number {
  if (view.byteLength < 4) return -1;
  // SOI
  if (view.getUint16(0, false) !== 0xffd8) return -1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);
    // Every segment marker starts with 0xFF.
    if ((marker & 0xff00) !== 0xff00) return -1;
    const size = view.getUint16(offset + 2, false);
    if (size < 2) return -1;
    if (marker === 0xffe1) {
      const exifHeader = offset + 4;
      if (exifHeader + 6 > view.byteLength) return -1;
      // "Exif\0\0"
      if (
        view.getUint32(exifHeader, false) === 0x45786966 &&
        view.getUint16(exifHeader + 4, false) === 0x0000
      ) {
        return exifHeader + 6;
      }
    }
    // Stop at start-of-scan; EXIF always precedes image data.
    if (marker === 0xffda) return -1;
    offset += 2 + size;
  }
  return -1;
}

function readValue(
  view: DataView,
  tiff: number,
  type: number,
  count: number,
  valueOffset: number,
  little: boolean,
): unknown {
  const size = TYPE_SIZES[type];
  if (!size) return undefined;
  const total = size * count;
  // Values over 4 bytes are stored elsewhere, addressed relative to the TIFF header.
  const base =
    total > 4 ? tiff + view.getUint32(valueOffset, little) : valueOffset;
  if (base < 0 || base + total > view.byteLength) return undefined;

  const readOne = (i: number): number | ExifRational | string | undefined => {
    const at = base + i * size;
    switch (type) {
      case TYPE_BYTE:
        return view.getUint8(at);
      case TYPE_SHORT:
        return view.getUint16(at, little);
      case TYPE_LONG:
        return view.getUint32(at, little);
      case TYPE_SLONG:
        return view.getInt32(at, little);
      case TYPE_RATIONAL:
        return {
          numerator: view.getUint32(at, little),
          denominator: view.getUint32(at + 4, little),
        };
      case TYPE_SRATIONAL:
        return {
          numerator: view.getInt32(at, little),
          denominator: view.getInt32(at + 4, little),
        };
      default:
        return undefined;
    }
  };

  if (type === TYPE_ASCII) {
    let out = '';
    for (let i = 0; i < count; i++) {
      const code = view.getUint8(base + i);
      if (code === 0) break;
      out += String.fromCharCode(code);
    }
    return out;
  }

  if (count === 1) return readOne(0);
  const values: unknown[] = [];
  for (let i = 0; i < count; i++) values.push(readOne(i));
  return values;
}

interface IfdEntry {
  tag: number;
  value: unknown;
}

/** Reads one IFD, returning its entries and the sub-IFD pointers it declares. */
function readIfd(
  view: DataView,
  tiff: number,
  ifdOffset: number,
  little: boolean,
): { entries: IfdEntry[]; pointers: Record<number, number> } {
  const entries: IfdEntry[] = [];
  const pointers: Record<number, number> = {};
  if (ifdOffset + 2 > view.byteLength) return { entries, pointers };
  const count = view.getUint16(ifdOffset, little);
  // Guard against a corrupt count claiming more entries than the buffer holds.
  const maxEntries = Math.min(count, Math.floor((view.byteLength - ifdOffset - 2) / 12));
  for (let i = 0; i < maxEntries; i++) {
    const entry = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const valueCount = view.getUint32(entry + 4, little);
    // A pathological count would make readValue allocate wildly; cap it.
    if (valueCount > 0xffff) continue;
    if (tag === EXIF_IFD_POINTER || tag === GPS_IFD_POINTER) {
      pointers[tag] = view.getUint32(entry + 8, little);
      continue;
    }
    const value = readValue(view, tiff, type, valueCount, entry + 8, little);
    if (value !== undefined) entries.push({ tag, value });
  }
  return { entries, pointers };
}

/**
 * Extracts the EXIF tags the app consumes from JPEG bytes.
 * Returns {} for non-JPEG input, missing EXIF, or malformed structures.
 */
export function readExifFromArrayBuffer(buffer: ArrayBuffer): ExifRecord {
  const out: ExifRecord = {};
  try {
    const view = new DataView(buffer);
    const tiff = findTiffOffset(view);
    if (tiff < 0 || tiff + 8 > view.byteLength) return out;

    const byteOrder = view.getUint16(tiff, false);
    if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return out;
    const little = byteOrder === 0x4949;
    if (view.getUint16(tiff + 2, little) !== 0x002a) return out;

    const ifd0Offset = view.getUint32(tiff + 4, little);
    const ifd0 = readIfd(view, tiff, tiff + ifd0Offset, little);

    if (ifd0.pointers[EXIF_IFD_POINTER] != null) {
      const exifIfd = readIfd(view, tiff, tiff + ifd0.pointers[EXIF_IFD_POINTER], little);
      for (const { tag, value } of exifIfd.entries) {
        if (tag === DATE_TIME_ORIGINAL) out.DateTimeOriginal = value;
      }
      // Some writers place the GPS pointer in the Exif IFD rather than IFD0.
      if (exifIfd.pointers[GPS_IFD_POINTER] != null) {
        ifd0.pointers[GPS_IFD_POINTER] = exifIfd.pointers[GPS_IFD_POINTER];
      }
    }

    if (ifd0.pointers[GPS_IFD_POINTER] != null) {
      const gps = readIfd(view, tiff, tiff + ifd0.pointers[GPS_IFD_POINTER], little);
      for (const { tag, value } of gps.entries) {
        switch (tag) {
          case GPS_LATITUDE_REF:
            out.GPSLatitudeRef = value;
            break;
          case GPS_LATITUDE:
            out.GPSLatitude = value;
            break;
          case GPS_LONGITUDE_REF:
            out.GPSLongitudeRef = value;
            break;
          case GPS_LONGITUDE:
            out.GPSLongitude = value;
            break;
          case GPS_ALTITUDE:
            out.GPSAltitude = value;
            break;
          case GPS_TIMESTAMP:
            out.GPSTimeStamp = value;
            break;
          default:
            break;
        }
      }
    }
  } catch {
    return out;
  }
  return out;
}

/** Convenience wrapper for a picked File/Blob. Never throws. */
export async function readExifFromFile(file: Blob): Promise<ExifRecord> {
  try {
    // EXIF lives in the first APP segments; 512KB is ample and avoids reading huge files.
    const head = file.slice(0, Math.min(file.size, 512 * 1024));
    return readExifFromArrayBuffer(await head.arrayBuffer());
  } catch {
    return {};
  }
}
