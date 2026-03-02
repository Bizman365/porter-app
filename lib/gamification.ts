import { useEffect, useMemo, useState } from 'react';

// ─── Reward Catalog ───
export type Reward = {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  category: 'cash' | 'prize' | 'time_off' | 'custom';
  icon: string; // emoji
  active: boolean;
};

// ─── Bonus Rules ───
export type BonusRule = {
  id: string;
  name: string;
  description: string;
  type: 'streak' | 'perfect_building' | 'early_bird' | 'photo_quality' | 'custom';
  icon: string;
  multiplier?: number; // e.g. 2 = 2x points
  bonusPoints?: number; // flat bonus
  condition: string; // human-readable condition
  enabled: boolean;
};

// ─── Cash Out ───
export type CashOutConfig = {
  enabled: boolean;
  pointsPerDollar: number; // e.g. 20 = 20 points per $1
  minCashOut: number; // minimum points to cash out
};

// ─── Points Config ───
export type PointsConfig = {
  perTask: number;
  perBuilding: number;
  expirationDays: number | null; // null = no expiration
};

// ─── Gamification State ───
export type GamificationConfig = {
  rewards: Reward[];
  bonusRules: BonusRule[];
  cashOut: CashOutConfig;
  pointsConfig: PointsConfig;
};

// ─── Milestones ───
export type Milestone = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'buildings_cleaned' | 'streak_days' | 'points_earned' | 'perfect_buildings';
};

export const MILESTONES: Milestone[] = [
  { id: 'ms_10_bldg', name: 'Getting Started', description: '10 buildings cleaned', icon: '🏠', requirement: 10, type: 'buildings_cleaned' },
  { id: 'ms_50_bldg', name: 'Veteran', description: '50 buildings cleaned', icon: '🏢', requirement: 50, type: 'buildings_cleaned' },
  { id: 'ms_100_bldg', name: 'Century Club', description: '100 buildings cleaned', icon: '🏛️', requirement: 100, type: 'buildings_cleaned' },
  { id: 'ms_500_bldg', name: 'Legend', description: '500 buildings cleaned', icon: '👑', requirement: 500, type: 'buildings_cleaned' },
  { id: 'ms_7_streak', name: 'Week Warrior', description: '7-day streak', icon: '🔥', requirement: 7, type: 'streak_days' },
  { id: 'ms_30_streak', name: 'Iron Will', description: '30-day streak', icon: '💪', requirement: 30, type: 'streak_days' },
  { id: 'ms_90_streak', name: 'Unstoppable', description: '90-day streak', icon: '⚡', requirement: 90, type: 'streak_days' },
  { id: 'ms_500_pts', name: 'Point Collector', description: '500 points earned', icon: '💰', requirement: 500, type: 'points_earned' },
  { id: 'ms_2000_pts', name: 'High Roller', description: '2,000 points earned', icon: '💎', requirement: 2000, type: 'points_earned' },
  { id: 'ms_10_perfect', name: 'Perfectionist', description: '10 perfect buildings', icon: '✨', requirement: 10, type: 'perfect_buildings' },
];

// ─── Default Config ───
const defaultConfig: GamificationConfig = {
  rewards: [
    { id: 'rw_1', name: '$10 Gift Card', description: 'Amazon, Starbucks, or Visa gift card', pointCost: 200, category: 'cash', icon: '🎁', active: true },
    { id: 'rw_2', name: '$25 Gift Card', description: 'Your choice of retailer', pointCost: 450, category: 'cash', icon: '💳', active: true },
    { id: 'rw_3', name: 'Half Day Off', description: 'Paid half day off (manager approval)', pointCost: 800, category: 'time_off', icon: '🏖️', active: true },
    { id: 'rw_4', name: 'Full Day Off', description: 'Paid day off (manager approval)', pointCost: 1500, category: 'time_off', icon: '🌴', active: true },
    { id: 'rw_5', name: 'Lunch On Us', description: 'Company-paid lunch up to $20', pointCost: 150, category: 'prize', icon: '🍕', active: true },
    { id: 'rw_6', name: 'Porter of the Month', description: 'Featured on building bulletin + $50 bonus', pointCost: 1000, category: 'prize', icon: '🏆', active: true },
  ],
  bonusRules: [
    { id: 'br_1', name: 'Streak Bonus', description: 'Earn bonus for consecutive work days', type: 'streak', icon: '🔥', multiplier: undefined, bonusPoints: 25, condition: '5+ consecutive days', enabled: true },
    { id: 'br_2', name: 'Perfect Building', description: 'Complete all tasks at a building', type: 'perfect_building', icon: '⭐', bonusPoints: 20, condition: 'All tasks checked off + photos', enabled: true },
    { id: 'br_3', name: 'Early Bird', description: 'Check in before 8:00 AM', type: 'early_bird', icon: '🌅', bonusPoints: 10, condition: 'First check-in before 8:00 AM', enabled: true },
    { id: 'br_4', name: 'Photo Pro', description: 'Submit evidence photos for every area', type: 'photo_quality', icon: '📸', bonusPoints: 15, condition: 'All cleaned areas have photos', enabled: true },
    { id: 'br_5', name: 'Double Down', description: '2x points on weekends', type: 'custom', icon: '⚡', multiplier: 2, condition: 'Saturday or Sunday shifts', enabled: false },
  ],
  cashOut: {
    enabled: true,
    pointsPerDollar: 20,
    minCashOut: 200,
  },
  pointsConfig: {
    perTask: 5,
    perBuilding: 15,
    expirationDays: null,
  },
};

let configState = { ...defaultConfig };

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function getGamificationConfig() {
  return configState;
}

export function updateGamificationConfig(partial: Partial<GamificationConfig>) {
  configState = { ...configState, ...partial };
  emit();
}

export function updateReward(id: string, updates: Partial<Reward>) {
  configState = {
    ...configState,
    rewards: configState.rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  };
  emit();
}

export function addReward(reward: Reward) {
  configState = { ...configState, rewards: [...configState.rewards, reward] };
  emit();
}

export function removeReward(id: string) {
  configState = { ...configState, rewards: configState.rewards.filter((r) => r.id !== id) };
  emit();
}

export function toggleBonusRule(id: string) {
  configState = {
    ...configState,
    bonusRules: configState.bonusRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
  };
  emit();
}

export function updateCashOut(partial: Partial<CashOutConfig>) {
  configState = { ...configState, cashOut: { ...configState.cashOut, ...partial } };
  emit();
}

export function updatePointsConfig(partial: Partial<PointsConfig>) {
  configState = { ...configState, pointsConfig: { ...configState.pointsConfig, ...partial } };
  emit();
}

export function useGamificationConfig() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return configState;
}

// ─── Porter Stats (mock) ───
export type PorterStats = {
  totalPoints: number;
  availablePoints: number;
  currentStreak: number;
  buildingsCleaned: number;
  perfectBuildings: number;
  redemptions: Array<{ rewardName: string; pointsSpent: number; date: string }>;
};

export function getPorterStats(): PorterStats {
  return {
    totalPoints: 485,
    availablePoints: 335,
    currentStreak: 12,
    buildingsCleaned: 67,
    perfectBuildings: 23,
    redemptions: [
      { rewardName: 'Lunch On Us', pointsSpent: 150, date: '2026-02-28' },
    ],
  };
}
