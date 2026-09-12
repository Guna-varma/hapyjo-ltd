/**
 * Validation tests for work photo upload: best and worst cases.
 */
import { isAllowedImageFormat } from '../workPhotoUpload';

describe('isAllowedImageFormat', () => {
  describe('best cases', () => {
    it('accepts .jpg and .jpeg', () => {
      expect(isAllowedImageFormat('file:///photo.jpg')).toBe(true);
      expect(isAllowedImageFormat('file:///photo.jpeg')).toBe(true);
    });
    it('accepts .png, .heif, .heic, .webp', () => {
      expect(isAllowedImageFormat('file:///a.png')).toBe(true);
      expect(isAllowedImageFormat('file:///a.heif')).toBe(true);
      expect(isAllowedImageFormat('file:///a.heic')).toBe(true);
      expect(isAllowedImageFormat('file:///a.webp')).toBe(true);
    });
    it('accepts by MIME type', () => {
      expect(isAllowedImageFormat('file:///x', 'image/jpeg')).toBe(true);
      expect(isAllowedImageFormat('file:///x', 'image/png')).toBe(true);
      expect(isAllowedImageFormat('file:///x', 'image/heif')).toBe(true);
      expect(isAllowedImageFormat('file:///x', 'image/webp')).toBe(true);
    });
    it('ignores query string in URI for extension', () => {
      expect(isAllowedImageFormat('https://cdn.example/photo.jpg?token=abc')).toBe(true);
    });
  });

  describe('worst cases', () => {
    it('rejects empty or missing URI', () => {
      expect(isAllowedImageFormat('')).toBe(false);
      expect(isAllowedImageFormat('   ')).toBe(false);
    });
    it('rejects non-string URI', () => {
      expect(isAllowedImageFormat(null as unknown as string)).toBe(false);
      expect(isAllowedImageFormat(undefined as unknown as string)).toBe(false);
    });
    it('rejects unknown extension', () => {
      expect(isAllowedImageFormat('file:///photo.bmp')).toBe(false);
      expect(isAllowedImageFormat('file:///photo.gif')).toBe(false);
      expect(isAllowedImageFormat('file:///photo.tiff')).toBe(false);
      expect(isAllowedImageFormat('file:///noext')).toBe(false);
    });
    it('rejects unknown MIME', () => {
      expect(isAllowedImageFormat('file:///x', 'image/bmp')).toBe(false);
      expect(isAllowedImageFormat('file:///x', 'application/octet-stream')).toBe(false);
    });
    it('is case-insensitive for MIME', () => {
      expect(isAllowedImageFormat('file:///x', 'IMAGE/JPEG')).toBe(true);
    });
  });
});

/**
 * Regression: the browser picker hands the app blob: object URLs and the trip
 * screens convert them to data: URIs. Neither has a file extension, so the
 * extension check rejected every real capture with "Only image files are
 * allowed" — breaking trip start/end photos and work-progress photos on the web.
 */
describe('isAllowedImageFormat – browser URIs', () => {
  it('accepts blob: object URLs (type is verified by the caller / bytes)', () => {
    expect(isAllowedImageFormat('blob:http://localhost:3000/3f1c0a2e-9b1d-4c4e-8f2a-1e5b7c9d0a11')).toBe(true);
    expect(isAllowedImageFormat('blob:https://hapyjo.com/3f1c0a2e-9b1d-4c4e-8f2a-1e5b7c9d0a11')).toBe(true);
  });
  it('accepts data: URIs whose declared MIME is an allowed image type', () => {
    expect(isAllowedImageFormat('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
    expect(isAllowedImageFormat('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });
  it('rejects data: URIs of non-image types', () => {
    expect(isAllowedImageFormat('data:application/pdf;base64,JVBERi0=')).toBe(false);
    expect(isAllowedImageFormat('data:text/plain;base64,aGVsbG8=')).toBe(false);
  });
});
