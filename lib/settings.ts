import { useEffect, useState } from 'react';

export type LocationMismatchAction = 'allow_with_flag' | 'require_note' | 'block';

export type AppSettings = {
  requireQrCheckIn: boolean;
  geofenceRadiusMeters: number;
  locationMismatchAction: LocationMismatchAction;
};

let settingsState: AppSettings = {
  requireQrCheckIn: true,
  geofenceRadiusMeters: 150,
  locationMismatchAction: 'require_note',
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function getSettings(): AppSettings {
  return settingsState;
}

export function updateSettings(partial: Partial<AppSettings>) {
  settingsState = { ...settingsState, ...partial };
  emit();
}

export function useSettings(): AppSettings {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return settingsState;
}

export const MISMATCH_ACTION_LABELS: Record<LocationMismatchAction, { title: string; description: string }> = {
  allow_with_flag: {
    title: 'Allow & Flag',
    description: 'Porter can check in, but the session is flagged for admin review.',
  },
  require_note: {
    title: 'Require Explanation',
    description: 'Porter must provide a reason before checking in from wrong location.',
  },
  block: {
    title: 'Block Check-in',
    description: 'Porter cannot check in unless at the correct address.',
  },
};
