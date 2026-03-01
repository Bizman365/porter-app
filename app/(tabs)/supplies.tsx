import { Package, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { VoiceInput } from '../../components/VoiceInput';
import { Badge } from '../../components/ui/Badge';
import { SegmentedPills } from '../../components/ui/SegmentedPills';
import { useTheme } from '../../lib/colorScheme';
import { formatDateShort } from '../../lib/format';
import { mockCleaningSchedule, mockJanitorialInventory, type JanitorialItem, type RestockRequest } from '../../lib/mockData';
import { createRestockRequest, usePorterData } from '../../lib/porterSession';
import { FONT, RADII, SPACING, TYPE } from '../../lib/theme';

type Tab = 'supplies' | 'requests';

function categoryLabel(c: JanitorialItem['category']) {
  if (c === 'cleaner') return 'Cleaners';
  if (c === 'tool') return 'Tools';
  if (c === 'supply') return 'Supplies';
  return 'Equipment';
}

function stockTone(item: JanitorialItem) {
  if (item.currentStock >= item.minStock * 2) return 'success' as const;
  if (item.currentStock >= item.minStock) return 'warning' as const;
  return 'danger' as const;
}

function statusTone(status: RestockRequest['status']) {
  if (status === 'Delivered') return 'success' as const;
  if (status === 'Approved') return 'success' as const;
  if (status === 'Ordered') return 'warning' as const;
  return 'neutral' as const;
}

function urgencyTone(urgency: RestockRequest['urgency']) {
  return urgency === 'Urgent' ? ('danger' as const) : ('neutral' as const);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function StockBar({ item }: { item: JanitorialItem }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const target = Math.max(1, item.minStock * 2);
  const pct = clamp01(item.currentStock / target);
  const tone = stockTone(item);
  const fill = tone === 'success' ? c.success : tone === 'warning' ? c.warning : c.danger;

  return (
    <View
      style={{
        height: 10,
        borderRadius: 999,
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : c.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: fill }} />
    </View>
  );
}

export default function PorterInventoryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const { janitorialInventory, restockRequests } = usePorterData();
  const [tab, setTab] = useState<Tab>('supplies');

  const [newOpen, setNewOpen] = useState(false);
  const [buildingName, setBuildingName] = useState<string>(mockCleaningSchedule[0]?.buildingName ?? '');
  const [urgency, setUrgency] = useState<RestockRequest['urgency']>('Routine');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<string, { itemId: string; itemName: string; quantity: number }>>({});

  const buildings = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of mockCleaningSchedule) {
      if (!seen.has(s.buildingName)) {
        seen.add(s.buildingName);
        list.push(s.buildingName);
      }
    }
    return list;
  }, []);

  const grouped = useMemo(() => {
    const order: JanitorialItem['category'][] = ['cleaner', 'tool', 'supply', 'equipment'];
    const by: Record<JanitorialItem['category'], JanitorialItem[]> = { cleaner: [], tool: [], supply: [], equipment: [] };
    for (const item of janitorialInventory) by[item.category].push(item);
    for (const k of order) by[k].sort((a, b) => a.name.localeCompare(b.name));
    return { order, by };
  }, [janitorialInventory]);

  function toggleItem(item: JanitorialItem) {
    setSelected((prev) => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { itemId: item.id, itemName: item.name, quantity: 1 } };
    });
  }

  function setQty(itemId: string, next: number) {
    const q = Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1;
    setSelected((prev) => (prev[itemId] ? { ...prev, [itemId]: { ...prev[itemId], quantity: q } } : prev));
  }

  function resetForm() {
    setUrgency('Routine');
    setNotes('');
    setSelected({});
    setBuildingName(buildings[0] ?? '');
  }

  function submit() {
    const b = buildingName.trim();
    if (!b) {
      Alert.alert('Missing building', 'Select a building for this request.');
      return;
    }
    const items = Object.values(selected).filter((i) => i.quantity > 0);
    if (items.length === 0) {
      Alert.alert('No items selected', 'Select at least one item to restock.');
      return;
    }

    createRestockRequest({
      buildingName: b,
      urgency,
      items,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    setNewOpen(false);
    resetForm();
  }

  const canSubmit = buildingName.trim() && Object.keys(selected).length > 0;

  return (
    <Screen
      scroll={false}
      overlay={
        tab === 'requests' ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: SPACING.screenX, bottom: 14 }}>
            <Pressable
              onPress={() => setNewOpen(true)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: c.primary,
                  borderRadius: 999,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  ...theme.cardShadow,
                }}
              >
                <Plus color="#FFFFFF" size={18} />
                <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>New Request</Text>
              </View>
            </Pressable>
          </View>
        ) : null
      }
    >
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: c.textPrimary }}>Inventory</Text>
            <Text style={{ ...TYPE.body, color: c.textSecondary }}>Porter supplies + restock requests</Text>
          </View>
          <Package color={c.primary} size={20} />
        </View>

        <SegmentedPills
          value={tab}
          onChange={setTab}
          options={[
            { label: 'Supplies', value: 'supplies' },
            { label: 'Requests', value: 'requests' },
          ]}
        />
      </View>

      <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ gap: SPACING.cardGap, paddingBottom: 24 }}>
        {tab === 'supplies' ? (
          <>
            {grouped.order.map((cat) => {
              const items = grouped.by[cat];
              if (items.length === 0) return null;
              return (
                <View key={cat} style={{ gap: 10 }}>
                  <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>{categoryLabel(cat)}</Text>
                  {items.map((item) => {
                    const tone = stockTone(item);
                    const low = item.currentStock < item.minStock;
                    return (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: c.card,
                          borderRadius: RADII.card,
                          borderWidth: 1,
                          borderColor: c.border,
                          padding: 14,
                          gap: 10,
                          ...theme.cardShadow,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={{ ...TYPE.body, color: c.textSecondary }}>
                              {item.currentStock} {item.unit} • Min {item.minStock}
                            </Text>
                          </View>
                          {low ? <Badge label="Low stock" tone="danger" /> : <Badge label={tone === 'success' ? 'Healthy' : 'OK'} tone={tone} />}
                        </View>

                        <StockBar item={item} />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        ) : (
          <>
            {restockRequests.length === 0 ? (
              <View
                style={{
                  backgroundColor: c.card,
                  borderRadius: RADII.card,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: 16,
                  gap: 10,
                  alignItems: 'center',
                  ...theme.cardShadow,
                }}
              >
                <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: c.textPrimary }}>No restock requests</Text>
                <Text style={{ ...TYPE.body, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                  Create a request to restock supplies for your buildings.
                </Text>
              </View>
            ) : (
              restockRequests.map((r) => (
                <View
                  key={`${r.id}`}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: RADII.card,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: 14,
                    gap: 10,
                    ...theme.cardShadow,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }} numberOfLines={1}>
                        {r.buildingName}
                      </Text>
                      <Text style={{ ...TYPE.body, color: c.textSecondary }}>{formatDateShort(r.createdAtISO)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Badge label={r.urgency} tone={urgencyTone(r.urgency)} />
                      <Badge label={r.status} tone={statusTone(r.status)} />
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    {r.items.map((it) => (
                      <Text key={`${r.id}_${it.itemId}`} style={{ ...TYPE.body, color: c.textSecondary }}>
                        • {it.itemName} × {it.quantity}
                      </Text>
                    ))}
                  </View>

                  {r.notes ? (
                    <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }} numberOfLines={3}>
                      Notes: {r.notes}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={newOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNewOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ paddingTop: 20, paddingHorizontal: SPACING.screenX, paddingBottom: 12, gap: 6 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: c.textPrimary }}>New Restock Request</Text>
            <Text style={{ ...TYPE.body, color: c.textSecondary }}>Select a building and items to restock.</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.screenX, paddingBottom: 26, gap: 14 }}>
            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>Building</Text>
              <View style={{ gap: 10 }}>
                {buildings.map((b) => {
                  const active = b === buildingName;
                  return (
                    <Pressable key={b} onPress={() => setBuildingName(b)}>
                      {({ pressed }) => (
                        <View
                          style={{
                            backgroundColor: c.card,
                            borderRadius: RADII.card,
                            borderWidth: 1,
                            borderColor: active ? 'rgba(16,185,129,0.45)' : c.border,
                            padding: 14,
                            opacity: pressed ? 0.96 : 1,
                            ...theme.cardShadow,
                          }}
                        >
                          <Text style={{ fontFamily: active ? FONT.semibold : FONT.medium, fontSize: 14, color: c.textPrimary }} numberOfLines={1}>
                            {b}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>Urgency</Text>
              <SegmentedPills
                value={urgency}
                onChange={setUrgency}
                options={[
                  { label: 'Routine', value: 'Routine' },
                  { label: 'Urgent', value: 'Urgent' },
                ]}
              />
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>Items</Text>
              <View style={{ gap: 10 }}>
                {mockJanitorialInventory.map((it) => {
                  const picked = !!selected[it.id];
                  const qty = selected[it.id]?.quantity ?? 1;
                  return (
                    <View
                      key={it.id}
                      style={{
                        backgroundColor: c.card,
                        borderRadius: RADII.card,
                        borderWidth: 1,
                        borderColor: picked ? 'rgba(16,185,129,0.45)' : c.border,
                        padding: 14,
                        gap: 10,
                        ...theme.cardShadow,
                      }}
                    >
                      <Pressable onPress={() => toggleItem(it)} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }} numberOfLines={1}>
                              {it.name}
                            </Text>
                            <Text style={{ ...TYPE.body, color: c.textSecondary }}>
                              Unit: {it.unit} • In stock: {it.currentStock}
                            </Text>
                          </View>
                          <Badge label={picked ? 'Selected' : 'Tap'} tone={picked ? 'success' : 'neutral'} />
                        </View>
                      </Pressable>

                      {picked ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: c.textSecondary }}>Qty</Text>
                          <TextInput
                            value={`${qty}`}
                            onChangeText={(text) => setQty(it.id, Number(text.replace(/[^0-9]/g, '')))}
                            keyboardType="number-pad"
                            placeholder="1"
                            placeholderTextColor={c.textMuted}
                            style={{
                              flex: 1,
                              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                              borderWidth: 1,
                              borderColor: c.border,
                              borderRadius: RADII.button,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              fontFamily: FONT.regular,
                              fontSize: 14,
                              color: c.textPrimary,
                            }}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>Notes</Text>
              <View
                style={{
                  backgroundColor: c.card,
                  borderRadius: RADII.card,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: 12,
                  gap: 10,
                  ...theme.cardShadow,
                }}
              >
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add context (closet empty, upcoming inspection, etc.)"
                  placeholderTextColor={c.textMuted}
                  multiline
                  style={{ minHeight: 84, fontFamily: FONT.regular, fontSize: 14, color: c.textPrimary, lineHeight: 20 }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <VoiceInput onTranscribe={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))} />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
              <Pressable onPress={() => { setNewOpen(false); resetForm(); }} style={{ flex: 1 }}>
                {({ pressed }) => (
                  <View
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                      borderRadius: RADII.button,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: pressed ? 0.9 : 1,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textSecondary }}>Cancel</Text>
                  </View>
                )}
              </Pressable>

              <Pressable onPress={submit} disabled={!canSubmit} style={{ flex: 1 }}>
                {({ pressed }) => (
                  <View
                    style={{
                      backgroundColor: c.primary,
                      borderRadius: RADII.button,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: !canSubmit ? 0.5 : pressed ? 0.9 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>Submit</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
