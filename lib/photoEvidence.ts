import Constants from 'expo-constants';
import * as Location from 'expo-location';

import type { CleaningArea, CleaningPhoto } from './mockData';

export type PhotoMetadata = {
  capturedAt: string;
  gpsLat?: number;
  gpsLng?: number;
  buildingId: string;
  area: CleaningArea;
  deviceId: string;
  photoHash: string;
  porterId: string;
  checkInId: string;
};

function toHex8(n: number) {
  return (n >>> 0).toString(16).padStart(8, '0');
}

function fnv1a32(input: string, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function generatePhotoHash(uri: string): string {
  const seed = `${uri}|${new Date().toISOString()}|${Math.random().toString(16).slice(2)}`;
  const h1 = fnv1a32(seed, 0x811c9dc5);
  const h2 = fnv1a32(seed, h1 ^ 0x9e3779b9);
  const h3 = fnv1a32(seed, h2 ^ 0x85ebca6b);
  const h4 = fnv1a32(seed, h3 ^ 0xc2b2ae35);
  const h5 = fnv1a32(seed, h4 ^ 0x27d4eb2f);
  const h6 = fnv1a32(seed, h5 ^ 0x165667b1);
  const h7 = fnv1a32(seed, h6 ^ 0xd3a2646c);
  const h8 = fnv1a32(seed, h7 ^ 0xfd7046c5);
  return `${toHex8(h1)}${toHex8(h2)}${toHex8(h3)}${toHex8(h4)}${toHex8(h5)}${toHex8(h6)}${toHex8(h7)}${toHex8(h8)}`;
}

export function getDeviceId(): string {
  const anyConstants = Constants as any;
  const raw =
    anyConstants?.installationId ??
    anyConstants?.deviceId ??
    Constants?.sessionId ??
    anyConstants?.expoConfig?.extra?.deviceId ??
    anyConstants?.manifest?.extra?.deviceId ??
    'unknown_device';
  return String(raw);
}

async function tryGetGps() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return {};

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude };
  } catch {
    return {};
  }
}

export async function captureEvidencePhoto(
  uri: string,
  options: {
    area: CleaningArea;
    buildingId: string;
    porterId: string;
    checkInId: string;
  },
): Promise<CleaningPhoto> {
  const capturedAt = new Date().toISOString();
  const deviceId = getDeviceId();
  const photoHash = generatePhotoHash(uri);
  const gps = await tryGetGps();

  return {
    id: `cp_${Date.now()}`,
    uri,
    capturedAt,
    ...gps,
    area: options.area,
    deviceId,
    photoHash,
    buildingId: options.buildingId,
    porterId: options.porterId,
    checkInId: options.checkInId,
  };
}

export function formatEvidenceForExport(photos: CleaningPhoto[]): object {
  const list = [...photos].sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

  const buildings = new Set<string>();
  const devices = new Set<string>();
  const areas: Record<string, number> = {};

  for (const p of list) {
    if (p.buildingId) buildings.add(p.buildingId);
    if (p.deviceId) devices.add(p.deviceId);
    areas[p.area] = (areas[p.area] ?? 0) + 1;
  }

  const first = list[0]?.capturedAt;
  const last = list[list.length - 1]?.capturedAt;

  return {
    type: 'evidence_package',
    version: '1.0',
    generatedAt: new Date().toISOString(),
    summary: {
      totalPhotos: list.length,
      buildings: Array.from(buildings),
      deviceIds: Array.from(devices),
      byArea: areas,
      timeRange: first && last ? { startISO: first, endISO: last } : undefined,
    },
    chainOfCustody: list.map((p) => ({
      photoId: p.id,
      capturedAtISO: p.capturedAt,
      porterId: p.porterId,
      buildingId: p.buildingId,
      checkInId: p.checkInId,
      area: p.area,
      gpsLat: p.gpsLat,
      gpsLng: p.gpsLng,
      deviceId: p.deviceId,
      photoHash: p.photoHash,
      uri: p.uri,
    })),
  };
}

