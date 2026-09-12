/**
 * Browser geolocation types mirroring the slice of expo-location the app used,
 * so the ported call sites compile and behave unchanged.
 */

/** Mirrors expo-location's Accuracy enum (values kept for ordering comparisons). */
export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
} as const;

export type LocationAccuracy = (typeof Accuracy)[keyof typeof Accuracy];

export interface LocationObjectCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationObject {
  coords: LocationObjectCoords;
  timestamp: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Maps expo accuracy levels onto the browser's single enableHighAccuracy flag. */
function wantsHighAccuracy(accuracy: LocationAccuracy): boolean {
  return accuracy >= Accuracy.High;
}

function toLocationObject(position: GeolocationPosition): LocationObject {
  const c = position.coords;
  return {
    coords: {
      latitude: c.latitude,
      longitude: c.longitude,
      altitude: c.altitude ?? null,
      accuracy: c.accuracy ?? null,
      altitudeAccuracy: c.altitudeAccuracy ?? null,
      heading: c.heading ?? null,
      speed: c.speed ?? null,
    },
    timestamp: position.timestamp,
  };
}

/** Browser equivalent of Location.getCurrentPositionAsync. */
export function getCurrentPositionAsync(
  options: { accuracy?: LocationAccuracy } = {},
): Promise<LocationObject> {
  const accuracy = options.accuracy ?? Accuracy.Balanced;
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toLocationObject(position)),
      (err) => reject(new Error(geolocationErrorMessage(err))),
      {
        enableHighAccuracy: wantsHighAccuracy(accuracy),
        // The caller races this against its own timeout; keep the browser's generous.
        timeout: 30_000,
        maximumAge: 0,
      },
    );
  });
}

export function geolocationErrorMessage(err: GeolocationPositionError | Error): string {
  if ('code' in err) {
    switch (err.code) {
      case 1:
        return 'Location permission denied. Enable location access for this site and try again.';
      case 2:
        return 'Location unavailable. Please check your device location settings.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        break;
    }
  }
  return err.message || 'Could not get current position.';
}

/**
 * Browser equivalent of Location.getForegroundPermissionsAsync.
 * Uses the Permissions API where available; 'undetermined' when it is not.
 */
export async function getForegroundPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { status: 'denied' };
  }
  try {
    const permissions = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (!permissions?.query) return { status: 'undetermined' };
    const result = await permissions.query({ name: 'geolocation' as PermissionName });
    if (result.state === 'granted') return { status: 'granted' };
    if (result.state === 'denied') return { status: 'denied' };
    return { status: 'undetermined' };
  } catch {
    return { status: 'undetermined' };
  }
}

/**
 * Browser equivalent of Location.requestForegroundPermissionsAsync.
 * A browser only prompts on an actual position request, so this performs a
 * lightweight one and reports the resulting permission state.
 */
export async function requestForegroundPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { status: 'denied' };
  }
  try {
    await getCurrentPositionAsync({ accuracy: Accuracy.Lowest });
    return { status: 'granted' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return { status: /denied/i.test(msg) ? 'denied' : 'undetermined' };
  }
}
