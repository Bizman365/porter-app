import { useEffect, useState } from 'react';

export type AppSettings = {
  requireQrCheckIn: boolean;
};

let settingsState: AppSettings = {
  requireQrCheckIn: true,
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
