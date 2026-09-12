/**
 * EXIF GPS extraction from JPEG bytes.
 *
 * This replaces what expo-image-picker used to hand the app as `asset.exif`, and
 * it feeds parseExifGps() unchanged — so a photo that carries GPS from the camera
 * (or a third-party app) still stamps real coordinates on the web.
 */
import { describe, it, expect } from 'vitest';
import { readExifFromArrayBuffer } from '../readExif';
import { parseExifGps } from '../workPhotoExif';

/** Builds a minimal JPEG whose APP1 segment carries a GPS IFD. */
function buildJpegWithGps(options: {
  latDeg: number;
  latMin: number;
  latSec: number;
  latRef: string;
  lonDeg: number;
  lonMin: number;
  lonSec: number;
  lonRef: string;
  littleEndian?: boolean;
}): ArrayBuffer {
  const little = options.littleEndian ?? true;

  // GPS IFD: 4 entries (LatRef, Lat, LonRef, Lon) + next-IFD pointer.
  const entryCount = 4;
  const ifdSize = 2 + entryCount * 12 + 4;
  // Each coordinate is 3 RATIONALs = 24 bytes, stored after the IFD.
  const dataSize = 24 * 2;

  // TIFF header (8) + GPS IFD offset placement.
  // Layout: [TIFF header 8][IFD0 (1 entry -> GPS pointer)][GPS IFD][rational data]
  const ifd0Size = 2 + 1 * 12 + 4;
  const tiffSize = 8 + ifd0Size + ifdSize + dataSize;

  const tiff = new ArrayBuffer(tiffSize);
  const dv = new DataView(tiff);
  let p = 0;

  // --- TIFF header ---
  dv.setUint16(p, little ? 0x4949 : 0x4d4d, false);
  p += 2;
  dv.setUint16(p, 0x002a, little);
  p += 2;
  dv.setUint32(p, 8, little); // IFD0 at offset 8
  p += 4;

  // --- IFD0: one entry, the GPS IFD pointer ---
  const gpsIfdOffset = 8 + ifd0Size;
  dv.setUint16(p, 1, little);
  p += 2;
  dv.setUint16(p, 0x8825, little); // GPSInfoIFDPointer
  p += 2;
  dv.setUint16(p, 4, little); // LONG
  p += 2;
  dv.setUint32(p, 1, little); // count
  p += 4;
  dv.setUint32(p, gpsIfdOffset, little);
  p += 4;
  dv.setUint32(p, 0, little); // no next IFD
  p += 4;

  // --- GPS IFD ---
  const dataStart = gpsIfdOffset + ifdSize;
  const latDataOffset = dataStart;
  const lonDataOffset = dataStart + 24;

  dv.setUint16(p, entryCount, little);
  p += 2;

  const writeAsciiEntry = (tag: number, ref: string) => {
    dv.setUint16(p, tag, little);
    p += 2;
    dv.setUint16(p, 2, little); // ASCII
    p += 2;
    dv.setUint32(p, 2, little); // "N\0"
    p += 4;
    // <= 4 bytes lives inline in the value field
    dv.setUint8(p, ref.charCodeAt(0));
    dv.setUint8(p + 1, 0);
    dv.setUint8(p + 2, 0);
    dv.setUint8(p + 3, 0);
    p += 4;
  };

  const writeRationalEntry = (tag: number, offset: number) => {
    dv.setUint16(p, tag, little);
    p += 2;
    dv.setUint16(p, 5, little); // RATIONAL
    p += 2;
    dv.setUint32(p, 3, little); // deg, min, sec
    p += 4;
    dv.setUint32(p, offset, little);
    p += 4;
  };

  writeAsciiEntry(0x0001, options.latRef);
  writeRationalEntry(0x0002, latDataOffset);
  writeAsciiEntry(0x0003, options.lonRef);
  writeRationalEntry(0x0004, lonDataOffset);
  dv.setUint32(p, 0, little); // no next IFD
  p += 4;

  // --- rational payloads (numerator/denominator pairs) ---
  const writeRationals = (offset: number, values: number[]) => {
    let q = offset;
    for (const value of values) {
      // Use a denominator of 100 to exercise non-trivial rationals.
      dv.setUint32(q, Math.round(value * 100), little);
      dv.setUint32(q + 4, 100, little);
      q += 8;
    }
  };
  writeRationals(latDataOffset, [options.latDeg, options.latMin, options.latSec]);
  writeRationals(lonDataOffset, [options.lonDeg, options.lonMin, options.lonSec]);

  // --- wrap in a JPEG: SOI + APP1("Exif\0\0" + TIFF) + EOI ---
  const app1Payload = 6 + tiffSize;
  const jpeg = new Uint8Array(2 + 2 + 2 + app1Payload + 2);
  let j = 0;
  jpeg[j++] = 0xff;
  jpeg[j++] = 0xd8; // SOI
  jpeg[j++] = 0xff;
  jpeg[j++] = 0xe1; // APP1
  jpeg[j++] = ((app1Payload + 2) >> 8) & 0xff;
  jpeg[j++] = (app1Payload + 2) & 0xff;
  jpeg.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], j); // "Exif\0\0"
  j += 6;
  jpeg.set(new Uint8Array(tiff), j);
  j += tiffSize;
  jpeg[j++] = 0xff;
  jpeg[j++] = 0xd9; // EOI

  return jpeg.buffer;
}

describe('readExifFromArrayBuffer', () => {
  it('extracts GPS tags in the shape parseExifGps expects', () => {
    // Kigali-ish: 1°56'38"S, 30°3'34"E
    const buffer = buildJpegWithGps({
      latDeg: 1, latMin: 56, latSec: 38, latRef: 'S',
      lonDeg: 30, lonMin: 3, lonSec: 34, lonRef: 'E',
    });
    const exif = readExifFromArrayBuffer(buffer);

    expect(exif.GPSLatitudeRef).toBe('S');
    expect(exif.GPSLongitudeRef).toBe('E');
    expect(Array.isArray(exif.GPSLatitude)).toBe(true);
    expect(Array.isArray(exif.GPSLongitude)).toBe(true);
  });

  it('feeds parseExifGps to produce correct signed decimal degrees', () => {
    const buffer = buildJpegWithGps({
      latDeg: 1, latMin: 56, latSec: 38, latRef: 'S',
      lonDeg: 30, lonMin: 3, lonSec: 34, lonRef: 'E',
    });
    const coords = parseExifGps(readExifFromArrayBuffer(buffer));

    expect(coords).not.toBeNull();
    // South and East: latitude negative, longitude positive.
    expect(coords!.latitude).toBeCloseTo(-(1 + 56 / 60 + 38 / 3600), 5);
    expect(coords!.longitude).toBeCloseTo(30 + 3 / 60 + 34 / 3600, 5);
  });

  it('handles big-endian (Motorola) byte order', () => {
    const buffer = buildJpegWithGps({
      latDeg: 51, latMin: 30, latSec: 0, latRef: 'N',
      lonDeg: 0, lonMin: 7, lonSec: 0, lonRef: 'W',
      littleEndian: false,
    });
    const coords = parseExifGps(readExifFromArrayBuffer(buffer));

    expect(coords).not.toBeNull();
    expect(coords!.latitude).toBeCloseTo(51.5, 4);
    expect(coords!.longitude).toBeCloseTo(-(0 + 7 / 60), 4);
  });

  it('returns an empty record for a JPEG with no EXIF', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    expect(readExifFromArrayBuffer(jpeg.buffer)).toEqual({});
  });

  it('returns an empty record for non-JPEG bytes', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(readExifFromArrayBuffer(png.buffer)).toEqual({});
  });

  it('does not throw on truncated or corrupt data', () => {
    const full = new Uint8Array(
      buildJpegWithGps({
        latDeg: 1, latMin: 0, latSec: 0, latRef: 'N',
        lonDeg: 1, lonMin: 0, lonSec: 0, lonRef: 'E',
      }),
    );
    for (const cut of [4, 10, 20, 40]) {
      expect(() => readExifFromArrayBuffer(full.slice(0, cut).buffer)).not.toThrow();
    }
    expect(() => readExifFromArrayBuffer(new ArrayBuffer(0))).not.toThrow();
  });

  it('yields null coordinates when GPS is absent, so callers fall back to live location', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    expect(parseExifGps(readExifFromArrayBuffer(jpeg.buffer))).toBeNull();
  });
});
