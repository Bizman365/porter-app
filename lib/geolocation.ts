import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export type GeoResult = {
  ok: true;
  latitude: number;
  longitude: number;
  accuracy: number | null;
} | {
  ok: false;
  reason: 'permission_denied' | 'unavailable' | 'timeout';
  message: string;
};

export async function getCurrentLocation(): Promise<GeoResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'permission_denied', message: 'Location permission is required for check-in.' };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      ok: true,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (err: any) {
    return { ok: false, reason: 'unavailable', message: err?.message ?? 'Could not get location.' };
  }
}

/**
 * Haversine distance in meters between two lat/lng points.
 */
export function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Default radius in meters to consider "at the building" */
export const DEFAULT_GEOFENCE_RADIUS = 150; // ~500 feet
