/**
 * Save an image from a URL to the device by triggering a browser download.
 * This is the web branch the mobile module already implemented.
 */

/**
 * Saves the image at imageUrl. suggestedName is used as the filename (e.g. "trip-123-start.jpg").
 */
export async function saveImageToDevice(imageUrl: string, suggestedName: string): Promise<void> {
  const ext = suggestedName.includes('.') ? '' : '.jpg';
  const filename = suggestedName.endsWith('.jpg') || suggestedName.endsWith('.jpeg') || suggestedName.endsWith('.png') ? suggestedName : `${suggestedName}${ext}`;

  const res = await fetch(imageUrl, { mode: 'cors' });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
