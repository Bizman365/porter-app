import { MapPin, QrCode, Settings, ShieldAlert, Trophy } from 'lucide-react-native';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { useTheme } from '../../lib/colorScheme';
import { getActiveStaff } from '../../lib/mockData';
import {
  MISMATCH_ACTION_LABELS,
  updateSettings,
  useSettings,
  type LocationMismatchAction,
} from '../../lib/settings';
import { FONT, RADII, SPACING, TYPE } from '../../lib/theme';

const MISMATCH_OPTIONS: LocationMismatchAction[] = ['allow_with_flag', 'require_note', 'block'];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const staff = getActiveStaff();
  const settings = useSettings();

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.screenX, paddingTop: 16, paddingBottom: 24 }}>
        <Text style={{ ...TYPE.heroNumber, color: c.textPrimary, fontSize: 26 }}>Profile</Text>
      </View>

      {/* Staff Info */}
      <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, padding: 20, marginBottom: SPACING.sectionGap }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: c.textPrimary }}>{staff.name}</Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: c.textSecondary, marginTop: 4 }}>{staff.role}</Text>
      </View>

      {/* Settings Section */}
      <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Settings color={c.textSecondary} size={16} />
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>Check-in Settings</Text>
        </View>
      </View>

      <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, overflow: 'hidden', marginBottom: SPACING.sectionGap }}>
        {/* QR Check-in Toggle */}
        <Pressable
          onPress={() => updateSettings({ requireQrCheckIn: !settings.requireQrCheckIn })}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 16 }}>
            <QrCode color={c.primary} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Require QR Check-in</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>
                {settings.requireQrCheckIn ? 'Porters must scan a QR code.' : 'GPS location used instead.'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.requireQrCheckIn}
            onValueChange={(v) => updateSettings({ requireQrCheckIn: v })}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          />
        </Pressable>

        {/* Geofence Radius */}
        {!settings.requireQrCheckIn && (
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <MapPin color={c.primary} size={20} />
              <View>
                <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Geofence Radius</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>
                  How close the porter must be to the building
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[100, 150, 300, 500].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => updateSettings({ geofenceRadiusMeters: r })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: RADII.button,
                    alignItems: 'center',
                    backgroundColor: settings.geofenceRadiusMeters === r ? c.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text style={{
                    fontFamily: FONT.semibold,
                    fontSize: 13,
                    color: settings.geofenceRadiusMeters === r ? '#FFFFFF' : c.textSecondary,
                  }}>
                    {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                  </Text>
                  <Text style={{
                    fontFamily: FONT.regular,
                    fontSize: 10,
                    color: settings.geofenceRadiusMeters === r ? 'rgba(255,255,255,0.7)' : c.textMuted,
                    marginTop: 2,
                  }}>
                    ~{Math.round(r * 3.28084)}ft
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Location Mismatch Action */}
        {!settings.requireQrCheckIn && (
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <ShieldAlert color={c.warning} size={20} />
              <View>
                <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Wrong Location Action</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>
                  What happens when a porter isn't at the address
                </Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {MISMATCH_OPTIONS.map((action) => {
                const selected = settings.locationMismatchAction === action;
                const label = MISMATCH_ACTION_LABELS[action];
                return (
                  <Pressable
                    key={action}
                    onPress={() => updateSettings({ locationMismatchAction: action })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: RADII.button,
                      borderWidth: 1.5,
                      borderColor: selected ? c.primary : c.border,
                      backgroundColor: selected ? (theme.isDark ? 'rgba(5,150,105,0.12)' : '#ECFDF5') : 'transparent',
                    }}
                  >
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selected ? c.primary : c.textMuted,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary }} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }}>{label.title}</Text>
                      <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.textMuted, marginTop: 2 }}>{label.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Gamification Section */}
      <View style={{ paddingHorizontal: SPACING.screenX, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy color={c.textSecondary} size={16} />
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>Gamification</Text>
        </View>
      </View>

      <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, overflow: 'hidden', marginBottom: SPACING.sectionGap }}>
        <Pressable
          onPress={() => updateSettings({ enableGamification: !settings.enableGamification })}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 16 }}>
            <Trophy color={settings.enableGamification ? c.primary : c.textMuted} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Enable Points & Rewards</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>
                {settings.enableGamification ? 'Porters earn points for completed tasks and buildings.' : 'Points and gamification features are hidden.'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.enableGamification}
            onValueChange={(v) => updateSettings({ enableGamification: v })}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          />
        </Pressable>
      </View>
    </Screen>
  );
}
