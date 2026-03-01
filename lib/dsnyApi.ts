/**
 * DSNY Collection Schedule API
 * Free, no API key required.
 * Endpoint: https://dsnypublic.nyc.gov/dsny/api/geocoder/DSNYCollection
 */

import type { DSNYSchedule } from './mockData';

/* ─── Types from the DSNY API response ─────────────────── */

interface DSNYApiResponse {
  Goat: {
    sanitationDistrict: string;
    sanitationSection: string;
    sanitationCollectionSchedulingSectionAndSubsection: string;
    sanitationRegularCollectionSchedule: string; // e.g. "MWF"
    sanitationRecyclingCollectionSchedule: string; // e.g. "EW"
    sanitationOrganicsCollectionSchedule: string; // e.g. "EW"
    sanitationBulkPickupCollectionSchedule: string; // e.g. "EMF"
    sanitationSnowPriorityCode: string; // e.g. "H"
    sanitationCommercialWasteZone: string;
    latitude: number;
    longitude: number;
    zipCode: string;
    CrossStreet: string;
    PickupStreets: string[];
  } | null;
  RoutingTime: {
    CommercialRoutingTime: string;
    ResidentialRoutingTime: string;
    MixedUseRoutingTime: string;
  } | null;
  BulkPickupCollectionSchedule: string; // "Monday,Friday"
  RegularCollectionSchedule: string; // "Monday,Wednesday,Friday"
  RecyclingCollectionSchedule: string; // "Wednesday"
  OrganicsCollectionSchedule: string; // "Wednesday"
  FormattedAddress: string;
  Suggestions: unknown;
}

export interface DSNYFullSchedule extends DSNYSchedule {
  bulkPickup: string[];
  snowPriority: string;
  residentialRoutingTime: string;
  commercialRoutingTime: string;
  crossStreet: string;
  pickupStreets: string[];
  formattedAddress: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  sanitationSection: string;
  commercialWasteZone: string;
}

/* ─── Day code mapping ─────────────────────────────────── */

const DSNY_DAY_CODES: Record<string, string> = {
  M: 'Mon',
  TU: 'Tue',
  T: 'Tue',
  W: 'Wed',
  TH: 'Thu',
  F: 'Fri',
  SA: 'Sat',
  S: 'Sat',
  SU: 'Sun',
};

function parseDSNYDayCodes(code: string): string[] {
  if (!code) return [];
  // Codes like "MWF", "EW", "ETH"
  // E = "every" prefix, sometimes used
  const cleaned = code.replace(/^E/, '').toUpperCase();
  const days: string[] = [];

  let i = 0;
  while (i < cleaned.length) {
    // Try two-char match first (TU, TH, SA, SU)
    if (i + 1 < cleaned.length) {
      const two = cleaned.substring(i, i + 2);
      if (DSNY_DAY_CODES[two]) {
        days.push(DSNY_DAY_CODES[two]);
        i += 2;
        continue;
      }
    }
    // Single char
    const one = cleaned[i];
    if (DSNY_DAY_CODES[one]) {
      days.push(DSNY_DAY_CODES[one]);
    }
    i++;
  }
  return days;
}

function parseCommaSeparatedDays(str: string): string[] {
  if (!str) return [];
  const dayMap: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  return str
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .map((d) => dayMap[d] ?? d)
    .filter(Boolean);
}

function extractSetOutTime(routingTime: string): string {
  // e.g. "Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM"
  // Set out is evening before, typically 6 PM onwards
  const match = routingTime.match(/(\d+:\d+\s*[AP]M)\s*-\s*(\d+:\d+\s*[AP]M).*?(\d+:\d+\s*[AP]M)/i);
  if (match) return match[3]; // last time slot start (evening pickup window)
  // Fallback: the night before
  return '8:00 PM';
}

/* ─── Cache ────────────────────────────────────────────── */

const cache = new Map<string, { data: DSNYFullSchedule; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

/* ─── Main fetch function ──────────────────────────────── */

export async function fetchDSNYSchedule(address: string): Promise<DSNYFullSchedule | null> {
  const cacheKey = address.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://dsnypublic.nyc.gov/dsny/api/geocoder/DSNYCollection?address=${encodeURIComponent(address)}&idForService=app-${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DSNY API returned ${res.status}`);

    const json: DSNYApiResponse = await res.json();
    if (!json.Goat) return null;

    const goat = json.Goat;
    const routing = json.RoutingTime;

    // Parse from both the Goat codes and the formatted strings (use formatted as primary, codes as fallback)
    const trash = parseCommaSeparatedDays(json.RegularCollectionSchedule).length > 0
      ? parseCommaSeparatedDays(json.RegularCollectionSchedule)
      : parseDSNYDayCodes(goat.sanitationRegularCollectionSchedule);

    const recycling = parseCommaSeparatedDays(json.RecyclingCollectionSchedule).length > 0
      ? parseCommaSeparatedDays(json.RecyclingCollectionSchedule)
      : parseDSNYDayCodes(goat.sanitationRecyclingCollectionSchedule);

    const compost = parseCommaSeparatedDays(json.OrganicsCollectionSchedule).length > 0
      ? parseCommaSeparatedDays(json.OrganicsCollectionSchedule)
      : parseDSNYDayCodes(goat.sanitationOrganicsCollectionSchedule);

    const bulkPickup = parseCommaSeparatedDays(json.BulkPickupCollectionSchedule).length > 0
      ? parseCommaSeparatedDays(json.BulkPickupCollectionSchedule)
      : parseDSNYDayCodes(goat.sanitationBulkPickupCollectionSchedule);

    const residentialRoutingTime = routing?.ResidentialRoutingTime ?? '';

    const result: DSNYFullSchedule = {
      trash,
      recycling,
      compost,
      setOutTime: extractSetOutTime(residentialRoutingTime),
      district: `${goat.sanitationDistrict}`,
      bulkPickup,
      snowPriority: goat.sanitationSnowPriorityCode,
      residentialRoutingTime,
      commercialRoutingTime: routing?.CommercialRoutingTime ?? '',
      crossStreet: goat.CrossStreet,
      pickupStreets: goat.PickupStreets ?? [],
      formattedAddress: json.FormattedAddress,
      latitude: goat.latitude,
      longitude: goat.longitude,
      zipCode: goat.zipCode,
      sanitationSection: goat.sanitationCollectionSchedulingSectionAndSubsection,
      commercialWasteZone: goat.sanitationCommercialWasteZone,
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn('[DSNY API] Failed to fetch schedule:', err);
    return null;
  }
}

/**
 * Fetch schedules for multiple buildings in parallel.
 */
export async function fetchDSNYSchedulesForBuildings(
  buildings: { id: string; address: string }[]
): Promise<Map<string, DSNYFullSchedule>> {
  const results = new Map<string, DSNYFullSchedule>();
  const fetches = buildings.map(async (b) => {
    const schedule = await fetchDSNYSchedule(b.address);
    if (schedule) results.set(b.id, schedule);
  });
  await Promise.allSettled(fetches);
  return results;
}

/**
 * Check if today is a collection day for a given type.
 */
export function isCollectionDay(days: string[], date = new Date()): boolean {
  const dow = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
  return days.includes(dow);
}

/**
 * Get a human-readable summary for today.
 */
export function todayCollectionSummary(schedule: DSNYFullSchedule, date = new Date()): string[] {
  const items: string[] = [];
  if (isCollectionDay(schedule.trash, date)) items.push('🗑️ Trash pickup');
  if (isCollectionDay(schedule.recycling, date)) items.push('♻️ Recycling pickup');
  if (isCollectionDay(schedule.compost, date)) items.push('🥬 Compost pickup');
  if (isCollectionDay(schedule.bulkPickup, date)) items.push('📦 Bulk pickup');
  return items;
}
