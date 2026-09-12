/**
 * Free reverse geocoding via OpenStreetMap Nominatim.
 * Goes through the existing `reverse-geocode` Supabase Edge Function, which is the
 * path the mobile app already used on web (browsers block direct Nominatim via CORS).
 * No API key. Respect usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

import { supabase } from '@/field-ops/lib/supabase';


export interface OSMAddressResult {
  display_name: string;
  city: string | undefined;
  state: string | undefined;
  country: string | undefined;
  postcode: string | undefined;
}

const REQUEST_DELAY_MS = 1100;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Use Edge Function on web to avoid CORS; direct fetch on native. */
async function reverseGeocodeViaProxy(lat: number, lon: number): Promise<OSMAddressResult> {
  const { data, error } = await supabase.functions.invoke<OSMAddressResult>('reverse-geocode', {
    body: { lat, lon },
  });
  if (error) throw new Error(error.message || 'Reverse geocode failed');
  if (!data) throw new Error('No data from reverse-geocode');
  return data;
}

export async function reverseGeocodeOSM(
  lat: number,
  lon: number,
  retries = 2
): Promise<OSMAddressResult> {
  // Browser: always via the Edge Function proxy — Nominatim blocks direct browser calls (CORS).
  const doRequest = () => reverseGeocodeViaProxy(lat, lon);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await delay(REQUEST_DELAY_MS * attempt);
      return await doRequest();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) continue;
    }
  }

  throw lastError ?? new Error('Reverse geocode failed');
}
