import { useEffect, useMemo, useState } from 'react';

import {
  getActiveStaff,
  mockCleaningLogs,
  mockCleaningSchedule,
  mockJanitorialInventory,
  mockRestockRequests,
  type CleaningArea,
  type CleaningLog,
  type CleaningLogStatus,
  type CleaningPhoto,
  type CleaningScheduleItem,
  type JanitorialItem,
  type RestockRequest,
} from './mockData';

export type ActiveCleaningSession = {
  buildingId: string;
  buildingName: string;
  address: string;
  porterId: string;
  checkedInAtISO: string;
  checkInId: string;
  qrScanId?: string;
  status: CleaningLogStatus;
  areas: CleaningArea[];
  checked: Record<CleaningArea, boolean>;
  photos: CleaningPhoto[];
  notes: string;
};

let scheduleState: CleaningScheduleItem[] = mockCleaningSchedule;
let activeSessionState: ActiveCleaningSession | null = null;
let cleaningLogsState: CleaningLog[] = mockCleaningLogs;
let janitorialInventoryState: JanitorialItem[] = mockJanitorialInventory;
let restockRequestsState: RestockRequest[] = mockRestockRequests;

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function subscribePorter(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPorterSchedule() {
  return scheduleState;
}

export function getActiveCleaningSession() {
  return activeSessionState;
}

export function getCleaningLogs() {
  return cleaningLogsState;
}

export function getJanitorialInventory() {
  return janitorialInventoryState;
}

export function getRestockRequests() {
  return restockRequestsState;
}

export function startCleaningSession(input: { buildingId: string; qrScanId?: string }) {
  const schedule = scheduleState.find((s) => s.buildingId === input.buildingId) ?? null;
  if (!schedule) return { ok: false as const, message: 'Unknown building.' };

  const porter = getActiveStaff();
  const checked: Record<CleaningArea, boolean> = {
    lobby: false,
    stairs: false,
    hallway: false,
    trash_room: false,
    laundry_room: false,
    elevator: false,
    courtyard: false,
    roof: false,
    basement: false,
    garage: false,
    common_bathroom: false,
    exterior: false,
  };

  const checkInId = `checkin_${Date.now()}`;
  activeSessionState = {
    buildingId: schedule.buildingId,
    buildingName: schedule.buildingName,
    address: schedule.address,
    porterId: porter.id,
    checkedInAtISO: new Date().toISOString(),
    checkInId,
    qrScanId: input.qrScanId,
    status: 'in_progress',
    areas: schedule.areas,
    checked,
    photos: [],
    notes: '',
  };

  scheduleState = scheduleState.map((s) => (s.buildingId === schedule.buildingId ? { ...s, status: 'in_progress' } : s));
  emit();
  return { ok: true as const, checkInId };
}

export function clearCleaningSession() {
  activeSessionState = null;
  emit();
}

export function setSessionNotes(notes: string) {
  if (!activeSessionState) return;
  activeSessionState = { ...activeSessionState, notes };
  emit();
}

export function toggleAreaChecked(area: CleaningArea) {
  if (!activeSessionState) return;
  activeSessionState = {
    ...activeSessionState,
    checked: { ...activeSessionState.checked, [area]: !activeSessionState.checked[area] },
  };
  emit();
}

export function addSessionPhoto(photo: CleaningPhoto) {
  if (!activeSessionState) return;
  activeSessionState = {
    ...activeSessionState,
    photos: [photo, ...activeSessionState.photos],
  };
  emit();
}

export function completeCleaningSession() {
  if (!activeSessionState) return { ok: false as const, message: 'No active session.' };

  const completedAt = new Date().toISOString();
  const checkedAreas = activeSessionState.areas.filter((a) => activeSessionState?.checked[a]);
  const newLogs: CleaningLog[] = checkedAreas.map((area, idx) => ({
    id: `cl_${Date.now()}_${idx}`,
    porterId: activeSessionState!.porterId,
    buildingName: activeSessionState!.buildingName,
    address: activeSessionState!.address,
    area,
    status: 'completed',
    checkedInAt: activeSessionState!.checkedInAtISO,
    completedAt,
    photos: activeSessionState!.photos.filter((p) => p.area === area),
    notes: activeSessionState!.notes.trim() || undefined,
    qrScanId: activeSessionState!.qrScanId,
  }));

  cleaningLogsState = [...newLogs, ...cleaningLogsState].slice(0, 120);
  scheduleState = scheduleState.map((s) => (s.buildingId === activeSessionState!.buildingId ? { ...s, status: 'completed' } : s));
  activeSessionState = null;

  emit();
  return { ok: true as const, createdLogs: newLogs.length };
}

export function createRestockRequest(input: {
  buildingName: string;
  urgency: 'Routine' | 'Urgent';
  items: Array<{ itemId: string; itemName: string; quantity: number }>;
  notes?: string;
}) {
  const staff = getActiveStaff();
  const maxId = restockRequestsState.reduce((m, r) => Math.max(m, r.id), 0);
  const next: RestockRequest = {
    id: maxId + 1,
    requestedBy: staff.id,
    requestedByName: staff.name,
    buildingName: input.buildingName,
    items: input.items,
    status: 'Requested',
    urgency: input.urgency,
    createdAtISO: new Date().toISOString(),
    notes: input.notes?.trim() ? input.notes.trim() : undefined,
  };

  restockRequestsState = [next, ...restockRequestsState].slice(0, 60);
  emit();
  return next;
}

export function usePorterData() {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribePorter(() => setTick((t) => t + 1)), []);

  return useMemo(
    () => ({
      tick,
      schedule: getPorterSchedule(),
      activeSession: getActiveCleaningSession(),
      logs: getCleaningLogs(),
      janitorialInventory: getJanitorialInventory(),
      restockRequests: getRestockRequests(),
    }),
    [tick],
  );
}
