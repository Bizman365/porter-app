import { router } from 'expo-router';
import { Building2, CheckCircle2, MapPin, Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../lib/colorScheme';
import { formatWeekdayMonthDay } from '../../lib/format';
import { useTranslation } from '../../lib/i18n';
import { getActiveStaff, type CleaningScheduleItem } from '../../lib/mockData';
import { usePorterData } from '../../lib/porterSession';
import { FONT, RADII, SPACING, TYPE } from '../../lib/theme';

function scheduleTone(status: 'scheduled' | 'in_progress' | 'completed') {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'warning' as const;
  return 'neutral' as const;
}

const dayAbbrevToChip: Record<string, string> = {
  Mon: 'M',
  Tue: 'Tu',
  Wed: 'W',
  Thu: 'Th',
  Fri: 'F',
  Sat: 'Sa',
  Sun: 'Su',
};

function formatDsnyDays(days: string[]) {
  return days.map((d) => dayAbbrevToChip[d] ?? d).join('/') || '—';
}

function weekdayShort(now: Date) {
  return now.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
}

function porterGreetingForNow(t: (key: string) => string, now = new Date()) {
  const h = now.getHours();
  if (h < 12) return t('today.goodMorning');
  if (h < 18) return t('today.goodAfternoon');
  return t('today.goodEvening');
}

function visibleTasksForBuilding(building: CleaningScheduleItem, todayDow: string) {
  return building.cleaningTasks.filter((task) => {
    if (task.id === 'take_out_recycling') return building.dsnySchedule.recycling.includes(todayDow);
    if (task.id === 'take_out_compost') return building.dsnySchedule.compost.includes(todayDow);
    return true;
  });
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: (props: { color: string; size: number }) => React.ReactElement;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.card,
        borderRadius: RADII.card,
        borderWidth: 1,
        borderColor: c.border,
        padding: 14,
        gap: 8,
        ...theme.cardShadow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>{label}</Text>
        {icon({ color: c.primary, size: 18 })}
      </View>
      <Text style={{ ...TYPE.heroNumber, color: c.textPrimary, fontSize: 26 }}>{value}</Text>
    </View>
  );
}

export default function PorterRouteScreen() {
  const staff = getActiveStaff();
  const { theme } = useTheme();
  const { locale, t } = useTranslation();
  const c = theme.colors;

  const { schedule, activeSession } = usePorterData();

  const todayLabel = formatWeekdayMonthDay(new Date().toISOString());
  const todayDow = weekdayShort(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDow = weekdayShort(tomorrow);

  const [taskChecks, setTaskChecks] = useState<Record<string, Record<string, boolean>>>(() => {
    const next: Record<string, Record<string, boolean>> = {};
    for (const b of schedule) {
      const visible = visibleTasksForBuilding(b, todayDow);
      const checkedAll = b.status === 'completed';
      next[b.buildingId] = Object.fromEntries(visible.map((task) => [task.id, checkedAll]));
    }
    return next;
  });

  useEffect(() => {
    setTaskChecks((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const b of schedule) {
        const visible = visibleTasksForBuilding(b, todayDow);
        const existing = next[b.buildingId] ?? {};
        const base: Record<string, boolean> = { ...existing };
        for (const task of visible) {
          if (typeof base[task.id] !== 'boolean') {
            base[task.id] = b.status === 'completed';
            changed = true;
          }
        }
        if (b.status === 'completed') {
          for (const task of visible) {
            if (!base[task.id]) {
              base[task.id] = true;
              changed = true;
            }
          }
        }
        next[b.buildingId] = base;
      }
      return changed ? next : prev;
    });
  }, [schedule, todayDow]);

  const stats = useMemo(() => {
    const buildingsToday = schedule.length;
    const tasksDone = schedule.reduce((acc, b) => {
      const visible = visibleTasksForBuilding(b, todayDow);
      const checks = taskChecks[b.buildingId] ?? {};
      return acc + visible.filter((t) => !!checks[t.id]).length;
    }, 0);
    const completedBuildings = schedule.filter((s) => s.status === 'completed').length;
    const points = tasksDone * 5 + completedBuildings * 15;
    return { buildingsToday, tasksDone, points };
  }, [schedule, taskChecks, todayDow]);

  const dsnyAlert = useMemo(() => {
    const anyTrashToday = schedule.some((b) => b.dsnySchedule.trash.includes(todayDow));
    const anyRecyclingToday = schedule.some((b) => b.dsnySchedule.recycling.includes(todayDow));
    const anyCompostToday = schedule.some((b) => b.dsnySchedule.compost.includes(todayDow));

    const anyTrashTomorrow = schedule.some((b) => b.dsnySchedule.trash.includes(tomorrowDow));
    const anyRecyclingTomorrow = schedule.some((b) => b.dsnySchedule.recycling.includes(tomorrowDow));
    const anyCompostTomorrow = schedule.some((b) => b.dsnySchedule.compost.includes(tomorrowDow));

    const setOutTime =
      schedule.find((b) => b.dsnySchedule.trash.includes(tomorrowDow))?.dsnySchedule.setOutTime ??
      schedule.find((b) => b.dsnySchedule.recycling.includes(tomorrowDow))?.dsnySchedule.setOutTime ??
      schedule.find((b) => b.dsnySchedule.compost.includes(tomorrowDow))?.dsnySchedule.setOutTime ??
      '8:00 PM';

    if (anyTrashToday) {
      const suffix = locale === 'es' ? ' — los botes deben estar afuera' : ' — bins should be out';
      return { icon: '🗑️', text: `${t('porter.trashPickupToday')}${suffix}` };
    }
    if (anyRecyclingToday) return { icon: '♻️', text: t('porter.recyclingPickupToday') };
    if (anyCompostToday) return { icon: '🥬', text: t('porter.compostPickupToday') };
    if (anyTrashTomorrow) return { icon: '🗑️', text: t('porter.trashTomorrow', { time: setOutTime }) };
    if (anyRecyclingTomorrow) return { icon: '♻️', text: t('porter.recyclingTomorrow', { time: setOutTime }) };
    if (anyCompostTomorrow) return { icon: '🥬', text: t('porter.compostTomorrow', { time: setOutTime }) };
    return null;
  }, [locale, schedule, t, todayDow, tomorrowDow]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: c.textPrimary }}>
            {porterGreetingForNow(t)}, {staff.name.split(' ')[0]}
          </Text>
          <Text style={{ ...TYPE.body, color: c.textSecondary }}>
            {todayLabel} · {t('porter.routeSubtitle')}
          </Text>
        </View>
        <Badge label={t('porter.syncedWithDSNY')} tone="success" />
      </View>

      {dsnyAlert ? (
        <View
          style={{
            backgroundColor: theme.isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.12)',
            borderRadius: RADII.card,
            borderWidth: 1,
            borderColor: 'rgba(16,185,129,0.35)',
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }}>
            {dsnyAlert.icon} {dsnyAlert.text}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: SPACING.cardGap }}>
        <StatCard
          label={t('porter.buildingsToday')}
          value={`${stats.buildingsToday}`}
          icon={({ color, size }) => <Building2 color={color} size={size} />}
        />
        <StatCard label={t('porter.tasksDone')} value={`${stats.tasksDone}`} icon={({ color, size }) => <CheckCircle2 color={color} size={size} />} />
        <StatCard label={t('today.points')} value={`${stats.points}`} icon={({ color, size }) => <Trophy color={color} size={size} />} />
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>{t('porter.buildingsToday')}</Text>

        {schedule.map((b) => {
          const isActive = activeSession?.buildingId === b.buildingId;
          const tasks = visibleTasksForBuilding(b, todayDow);
          const buildingChecks = taskChecks[b.buildingId] ?? {};

          const trashToday = b.dsnySchedule.trash.includes(todayDow);
          const recyclingToday = b.dsnySchedule.recycling.includes(todayDow);
          const compostToday = b.dsnySchedule.compost.includes(todayDow);

          const statusLabel =
            b.status === 'completed' ? t('status.completed') : b.status === 'in_progress' ? t('status.inProgress') : t('status.scheduled');

          return (
            <View
              key={b.buildingId}
              style={{
                backgroundColor: c.card,
                borderRadius: RADII.card,
                borderWidth: 1,
                borderColor: isActive ? 'rgba(16,185,129,0.45)' : c.border,
                padding: 14,
                gap: 10,
                ...theme.cardShadow,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: c.textPrimary }} numberOfLines={1}>
                    {b.buildingName}
                  </Text>
                  <Text style={{ ...TYPE.body, color: c.textSecondary }} numberOfLines={1}>
                    {b.address}
                  </Text>
                </View>
                <Badge label={isActive ? t('status.inProgress') : statusLabel} tone={isActive ? 'warning' : scheduleTone(b.status)} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>
                  {t('porter.trash')}: {formatDsnyDays(b.dsnySchedule.trash)} · {t('porter.recycling')}: {formatDsnyDays(b.dsnySchedule.recycling)} ·{' '}
                  {t('porter.compost')}: {formatDsnyDays(b.dsnySchedule.compost)}
                </Text>

                {(trashToday || recyclingToday || compostToday) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {trashToday ? <Badge label={`🗑️ ${t('porter.trashPickupToday')}`} tone="warning" /> : null}
                    {recyclingToday ? <Badge label={`♻️ ${t('porter.recyclingPickupToday')}`} tone="warning" /> : null}
                    {compostToday ? <Badge label={`🥬 ${t('porter.compostPickupToday')}`} tone="warning" /> : null}
                  </View>
                )}
              </View>

              <View style={{ gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : c.border }}>
                <View style={{ gap: 8 }}>
                  {tasks.map((task) => {
                    const checked = !!buildingChecks[task.id];
                    const label = locale === 'es' ? task.labelEs : task.label;
                    return (
                      <Pressable
                        key={`${b.buildingId}_${task.id}`}
                        onPress={() =>
                          setTaskChecks((prev) => ({
                            ...prev,
                            [b.buildingId]: { ...(prev[b.buildingId] ?? {}), [task.id]: !(prev[b.buildingId]?.[task.id] ?? false) },
                          }))
                        }
                        style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: checked ? 'rgba(16,185,129,0.55)' : c.border,
                              backgroundColor: checked ? (theme.isDark ? 'rgba(16,185,129,0.28)' : 'rgba(16,185,129,0.18)') : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {checked ? <Text style={{ fontFamily: FONT.bold, fontSize: 12, color: c.textPrimary }}>✓</Text> : null}
                          </View>
                          <Text style={{ ...TYPE.body, color: c.textSecondary, flex: 1 }}>
                            {task.icon} {label}
                          </Text>
                          {task.required ? <Text style={{ ...TYPE.labelCaps, color: c.textMuted }}>{t('common.required')}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 2 }}>
                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/porter-clean', params: { buildingId: b.buildingId, autoScan: '1' } })}
                  disabled={b.status === 'completed'}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: RADII.button,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: b.status === 'completed' ? (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6') : c.primary,
                        opacity: b.status === 'completed' ? 0.6 : pressed ? 0.92 : 1,
                      }}
                    >
                      <MapPin color={b.status === 'completed' ? c.textMuted : '#FFFFFF'} size={16} />
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: b.status === 'completed' ? c.textMuted : '#FFFFFF' }}>
                        {t('porter.checkIn')}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
