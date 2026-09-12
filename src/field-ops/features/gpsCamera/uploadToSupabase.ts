/**
 * Web port: identical bucket (gps-images), gps/ prefix, error messages and public API.
 */
import { supabase } from '@/field-ops/lib/supabase';
import { uriToArrayBuffer } from '@/field-ops/lib/uriToArrayBuffer';

const BUCKET = 'gps-images';
const PREFIX = 'gps/';

/** Uploads image to Supabase Storage (gps-images bucket). Returns public URL only after upload is persisted. */
export async function uploadToSupabase(compressedImageUri: string): Promise<string> {
  const fileName = `${PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await uriToArrayBuffer(compressedImageUri);
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Read image failed: ${e.message}` : 'Read image failed'
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(
      error.message === 'Network request failed'
        ? 'Upload failed: check your internet connection and that the app is signed in.'
        : `Upload failed: ${error.message}`
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
