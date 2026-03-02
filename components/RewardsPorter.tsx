import { Award, Flame, Gift, TrendingUp } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../lib/colorScheme';
import { getPorterStats, MILESTONES, useGamificationConfig } from '../lib/gamification';
import { FONT, RADII, SPACING, TYPE } from '../lib/theme';

export function RewardsPorter() {
  const { theme } = useTheme();
  const c = theme.colors;
  const config = useGamificationConfig();
  const stats = getPorterStats();

  const activeRewards = config.rewards.filter((r) => r.active);

  return (
    <View style={{ gap: SPACING.sectionGap }}>
      {/* Stats Overview */}
      <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: c.primary }}>{stats.availablePoints}</Text>
            <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Available</Text>
          </View>
          <View style={{ width: 1, backgroundColor: c.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: c.textPrimary }}>{stats.currentStreak}</Text>
            <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Day Streak 🔥</Text>
          </View>
          <View style={{ width: 1, backgroundColor: c.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: c.textPrimary }}>{stats.buildingsCleaned}</Text>
            <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Buildings</Text>
          </View>
        </View>
        {config.cashOut.enabled && stats.availablePoints >= config.cashOut.minCashOut && (
          <View style={{ marginTop: 16, backgroundColor: theme.isDark ? 'rgba(5,150,105,0.12)' : '#ECFDF5', borderRadius: RADII.button, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.primary }}>
              💵 Cash out: ${Math.floor(stats.availablePoints / config.cashOut.pointsPerDollar)} available
            </Text>
          </View>
        )}
      </View>

      {/* Available Rewards */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>🎁 Rewards</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, gap: 8 }}>
          {activeRewards.map((reward) => {
            const canRedeem = stats.availablePoints >= reward.pointCost;
            return (
              <View
                key={reward.id}
                style={{
                  backgroundColor: c.card, borderRadius: RADII.card, padding: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                }}
              >
                <Text style={{ fontSize: 32 }}>{reward.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>{reward.name}</Text>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.textMuted, marginTop: 2 }}>{reward.description}</Text>
                </View>
                <Pressable disabled={!canRedeem}>
                  {({ pressed }) => (
                    <View style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADII.button,
                      backgroundColor: canRedeem ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                      opacity: canRedeem ? (pressed ? 0.8 : 1) : 0.5,
                    }}>
                      <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: canRedeem ? '#FFF' : c.textMuted }}>{reward.pointCost} pts</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* Active Bonuses */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>⚡ Active Bonuses</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {config.bonusRules.filter((r) => r.enabled).map((rule) => (
            <View
              key={rule.id}
              style={{
                backgroundColor: c.card, borderRadius: RADII.card, padding: 12,
                flexDirection: 'row', alignItems: 'center', gap: 8,
                borderWidth: 1, borderColor: c.border,
              }}
            >
              <Text style={{ fontSize: 18 }}>{rule.icon}</Text>
              <View>
                <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: c.textPrimary }}>{rule.name}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: c.textMuted }}>
                  {rule.multiplier ? `${rule.multiplier}x points` : `+${rule.bonusPoints}pts`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Milestones */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>🏅 Milestones</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, gap: 8 }}>
          {MILESTONES.map((ms) => {
            const progress =
              ms.type === 'buildings_cleaned' ? stats.buildingsCleaned :
              ms.type === 'streak_days' ? stats.currentStreak :
              ms.type === 'points_earned' ? stats.totalPoints :
              ms.type === 'perfect_buildings' ? stats.perfectBuildings : 0;
            const unlocked = progress >= ms.requirement;
            const pct = Math.min(1, progress / ms.requirement);

            return (
              <View
                key={ms.id}
                style={{
                  backgroundColor: c.card, borderRadius: RADII.card, padding: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  opacity: unlocked ? 1 : 0.7,
                }}
              >
                <Text style={{ fontSize: 26 }}>{ms.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }}>{ms.name}</Text>
                    {unlocked && <Text style={{ fontFamily: FONT.bold, fontSize: 12, color: c.success }}>✓ Unlocked</Text>}
                  </View>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.textMuted, marginTop: 2 }}>{ms.description}</Text>
                  {!unlocked && (
                    <View style={{ marginTop: 6, height: 4, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB', borderRadius: 2 }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: c.primary, width: `${pct * 100}%` }} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
