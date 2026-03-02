import { DollarSign, Gift, Clock, Plus, Trash2, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { useTheme } from '../lib/colorScheme';
import {
  addReward,
  removeReward,
  toggleBonusRule,
  updateCashOut,
  updatePointsConfig,
  updateReward,
  useGamificationConfig,
  type Reward,
} from '../lib/gamification';
import { FONT, RADII, SPACING, TYPE } from '../lib/theme';

function CategoryIcon({ category, color, size }: { category: string; color: string; size: number }) {
  if (category === 'cash') return <DollarSign color={color} size={size} />;
  if (category === 'time_off') return <Clock color={color} size={size} />;
  return <Gift color={color} size={size} />;
}

export function RewardsAdmin() {
  const { theme } = useTheme();
  const c = theme.colors;
  const config = useGamificationConfig();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newCategory, setNewCategory] = useState<Reward['category']>('prize');

  function handleAddReward() {
    if (!newName.trim() || !newPoints.trim()) {
      Alert.alert('Required', 'Name and point cost are required.');
      return;
    }
    addReward({
      id: `rw_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      pointCost: parseInt(newPoints, 10) || 100,
      category: newCategory,
      icon: newCategory === 'cash' ? '💵' : newCategory === 'time_off' ? '🏖️' : '🎁',
      active: true,
    });
    setAddModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewPoints('');
  }

  const inputStyle = {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: c.textPrimary,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    borderRadius: RADII.button,
    padding: 12,
  };

  return (
    <View style={{ gap: SPACING.sectionGap }}>
      {/* Points Config */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>⚙️ Point Values</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.textPrimary }}>Points per task</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[3, 5, 10, 15].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => updatePointsConfig({ perTask: v })}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADII.button,
                    backgroundColor: config.pointsConfig.perTask === v ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: config.pointsConfig.perTask === v ? '#FFF' : c.textSecondary }}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.textPrimary }}>Points per building</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[10, 15, 25, 50].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => updatePointsConfig({ perBuilding: v })}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADII.button,
                    backgroundColor: config.pointsConfig.perBuilding === v ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: config.pointsConfig.perBuilding === v ? '#FFF' : c.textSecondary }}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.textPrimary }}>Points expire</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([{ label: 'Never', val: null }, { label: '90d', val: 90 }, { label: '180d', val: 180 }, { label: '1yr', val: 365 }] as const).map((opt) => (
                <Pressable
                  key={opt.label}
                  onPress={() => updatePointsConfig({ expirationDays: opt.val })}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.button,
                    backgroundColor: config.pointsConfig.expirationDays === opt.val ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: config.pointsConfig.expirationDays === opt.val ? '#FFF' : c.textSecondary }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Rewards Catalog */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>🎁 Rewards Catalog</Text>
          <Pressable onPress={() => setAddModalOpen(true)}>
            {({ pressed }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 }}>
                <Plus color={c.primary} size={16} />
                <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: c.primary }}>Add</Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, gap: 8 }}>
          {config.rewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: c.card, borderRadius: RADII.card, padding: 14,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                opacity: reward.active ? 1 : 0.5,
              }}
            >
              <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>{reward.name}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.textMuted, marginTop: 2 }}>{reward.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: c.primary }}>{reward.pointCost} pts</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Switch
                    value={reward.active}
                    onValueChange={(v) => updateReward(reward.id, { active: v })}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
                    thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                    style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                  />
                  <Pressable onPress={() => {
                    Alert.alert('Remove Reward', `Remove "${reward.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeReward(reward.id) },
                    ]);
                  }}>
                    <Trash2 color={c.danger} size={16} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Cash Out */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>💵 Cash Out</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, padding: 16, gap: 14 }}>
          <Pressable
            onPress={() => updateCashOut({ enabled: !config.cashOut.enabled })}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Allow Cash Out</Text>
            <Switch
              value={config.cashOut.enabled}
              onValueChange={(v) => updateCashOut({ enabled: v })}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </Pressable>
          {config.cashOut.enabled && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.textSecondary }}>Rate</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[10, 20, 50].map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => updateCashOut({ pointsPerDollar: v })}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.button,
                        backgroundColor: config.cashOut.pointsPerDollar === v ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                      }}
                    >
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 12, color: config.cashOut.pointsPerDollar === v ? '#FFF' : c.textSecondary }}>{v}pts/$1</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.textSecondary }}>Min cash out</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[100, 200, 500].map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => updateCashOut({ minCashOut: v })}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.button,
                        backgroundColor: config.cashOut.minCashOut === v ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                      }}
                    >
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 12, color: config.cashOut.minCashOut === v ? '#FFF' : c.textSecondary }}>{v}pts</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Bonus Rules */}
      <View>
        <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>⚡ Bonus Rules</Text>
        </View>
        <View style={{ marginHorizontal: SPACING.screenX, gap: 8 }}>
          {config.bonusRules.map((rule) => (
            <Pressable key={rule.id} onPress={() => toggleBonusRule(rule.id)}>
              <View
                style={{
                  backgroundColor: c.card, borderRadius: RADII.card, padding: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderWidth: 1.5,
                  borderColor: rule.enabled ? c.primary : c.border,
                  opacity: rule.enabled ? 1 : 0.6,
                }}
              >
                <Text style={{ fontSize: 24 }}>{rule.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }}>{rule.name}</Text>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.textMuted, marginTop: 2 }}>{rule.condition}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {rule.multiplier ? (
                    <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: c.warning }}>{rule.multiplier}x</Text>
                  ) : (
                    <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: c.primary }}>+{rule.bonusPoints}pts</Text>
                  )}
                  <Switch
                    value={rule.enabled}
                    onValueChange={() => toggleBonusRule(rule.id)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
                    thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                    style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Add Reward Modal */}
      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: c.card, borderRadius: RADII.card, padding: 20, gap: 16 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: c.textPrimary }}>Add Reward</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Reward name" placeholderTextColor={c.textMuted} style={inputStyle} />
            <TextInput value={newDesc} onChangeText={setNewDesc} placeholder="Description" placeholderTextColor={c.textMuted} style={inputStyle} />
            <TextInput value={newPoints} onChangeText={setNewPoints} placeholder="Point cost" placeholderTextColor={c.textMuted} keyboardType="numeric" style={inputStyle} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['cash', '💵'], ['prize', '🎁'], ['time_off', '🏖️'], ['custom', '⭐']] as const).map(([cat, icon]) => (
                <Pressable
                  key={cat}
                  onPress={() => setNewCategory(cat)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: RADII.button, alignItems: 'center',
                    backgroundColor: newCategory === cat ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                  <Text style={{ fontFamily: FONT.medium, fontSize: 11, color: newCategory === cat ? '#FFF' : c.textMuted, marginTop: 2 }}>
                    {cat === 'time_off' ? 'Time Off' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setAddModalOpen(false)} style={{ flex: 1 }}>
                {({ pressed }) => (
                  <View style={{ paddingVertical: 12, alignItems: 'center', borderRadius: RADII.button, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.8 : 1 }}>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textSecondary }}>Cancel</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={handleAddReward} style={{ flex: 1 }}>
                {({ pressed }) => (
                  <View style={{ paddingVertical: 12, alignItems: 'center', borderRadius: RADII.button, backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 }}>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>Add Reward</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
