/**
 * Shared browser replacement for the mobile `uriToArrayBuffer` helpers.
 * In a browser every URI the app produces (blob:, data:, http(s):, object URL
 * from an <input type="file">) is fetchable, which is exactly the branch the
 * mobile code already took when Platform.OS === 'web'.
 */
export async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Fetch image failed: ${res.status}`);
  return await res.arrayBuffer();
}
