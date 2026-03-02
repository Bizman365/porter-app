import { Settings } from 'lucide-react-native';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { useTheme } from '../../lib/colorScheme';
import { getActiveStaff } from '../../lib/mockData';
import { updateSettings, useSettings } from '../../lib/settings';
import { FONT, RADII, SPACING, TYPE } from '../../lib/theme';

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
          <Text style={{ ...TYPE.labelCaps, color: c.textSecondary }}>Settings</Text>
        </View>
      </View>

      <View style={{ marginHorizontal: SPACING.screenX, backgroundColor: c.card, borderRadius: RADII.card, overflow: 'hidden' }}>
        {/* QR Check-in Toggle */}
        <Pressable
          onPress={() => updateSettings({ requireQrCheckIn: !settings.requireQrCheckIn })}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Require QR Check-in</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: c.textMuted, marginTop: 4 }}>
              {settings.requireQrCheckIn
                ? 'Porters must scan a QR code to check in at each building.'
                : 'Porters can check in without scanning a QR code.'}
            </Text>
          </View>
          <Switch
            value={settings.requireQrCheckIn}
            onValueChange={(v) => updateSettings({ requireQrCheckIn: v })}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: c.primary }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          />
        </Pressable>
      </View>
    </Screen>
  );
}
