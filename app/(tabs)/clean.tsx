import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Stack, useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle2, MapPin, ScanLine, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { CameraCapture } from '../../components/CameraCapture';
import { Screen } from '../../components/Screen';
import { VoiceInput } from '../../components/VoiceInput';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../lib/colorScheme';
import { formatDateShort, formatWeekdayMonthDay } from '../../lib/format';
import { type CleaningArea } from '../../lib/mockData';
import { captureEvidencePhoto } from '../../lib/photoEvidence';
import {
  addSessionPhoto,
  completeCleaningSession,
  setSessionNotes,
  startCleaningSession,
  toggleAreaChecked,
  usePorterData,
} from '../../lib/porterSession';
import { FONT, RADII, SPACING, TYPE } from '../../lib/theme';
import { useSettings } from '../../lib/settings';

function titleCaseArea(area: CleaningArea) {
  return area
    .split('_')
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
    .join(' ');
}

function photosForArea(photos: Array<{ area: CleaningArea }>, area: CleaningArea) {
  return photos.filter((p) => p.area === area).length;
}

function canComplete(input: { areas: CleaningArea[]; checked: Record<CleaningArea, boolean>; photos: Array<{ area: CleaningArea }> }) {
  const checkedAreas = input.areas.filter((a) => input.checked[a]);
  if (checkedAreas.length === 0) return { ok: false as const, message: 'Select at least one area to complete.' };
  for (const area of checkedAreas) {
    if (photosForArea(input.photos, area) < 1) {
      return { ok: false as const, message: `Add at least 1 photo for ${titleCaseArea(area)}.` };
    }
  }
  return { ok: true as const };
}

function ScanModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (res: BarcodeScanningResult) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!visible) return;
    if (!permission) return;
    if (!permission.granted) requestPermission().catch(() => {});
  }, [permission, requestPermission, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.isDark ? '#0B0F16' : '#111827' }}>
        <View style={{ paddingTop: 52, paddingHorizontal: SPACING.screenX, paddingBottom: 10, gap: 4 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: '#FFFFFF' }}>Scan QR Check-in</Text>
          <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            Point your camera at the building QR code to start cleaning.
          </Text>
        </View>

        <View style={{ flex: 1, marginHorizontal: SPACING.screenX, marginBottom: 18, borderRadius: RADII.card, overflow: 'hidden' }}>
          {!permission ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Loading camera…</Text>
            </View>
          ) : !permission.granted ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 18 }}>
              <AlertCircle color="#FFFFFF" size={34} />
              <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: '#FFFFFF', textAlign: 'center' }}>
                Camera access is required
              </Text>
              <Pressable onPress={() => requestPermission().catch(() => {})}>
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: RADII.button,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: c.primary,
                      opacity: pressed ? 0.9 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>Allow Camera</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScanned} />
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <View
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <ScanLine color="rgba(255,255,255,0.7)" size={42} />
                  <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Point at QR</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: SPACING.screenX, paddingBottom: 26 }}>
          <Pressable onPress={onClose}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: RADII.button,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  opacity: pressed ? 0.92 : 1,
                }}
              >
                <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>Cancel</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function PorterCleanScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const params = useLocalSearchParams<{ buildingId?: string; autoScan?: string }>();

  const { schedule, activeSession, logs } = usePorterData();
  const settings = useSettings();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraArea, setCameraArea] = useState<CleaningArea | null>(null);

  const resultAnim = useMemo(() => new Animated.Value(0), []);

  const selectedBuilding = useMemo(() => {
    const id = typeof params.buildingId === 'string' ? params.buildingId : undefined;
    if (!id) return null;
    return schedule.find((s) => s.buildingId === id) ?? null;
  }, [params.buildingId, schedule]);

  useEffect(() => {
    if (activeSession) return;
    if (scanOpen) return;
    if (scanned) return;
    if (params.autoScan === '1') setScanOpen(true);
  }, [activeSession, params.autoScan, scanOpen, scanned]);

  const onScanned = useCallback(
    (res: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);

      const raw = (res.data ?? '').trim();
      const scheduleMatch =
        (typeof params.buildingId === 'string' && schedule.find((s) => s.buildingId === params.buildingId)) ||
        schedule.find((s) => raw.includes(s.buildingId)) ||
        null;

      const buildingId = scheduleMatch?.buildingId ?? schedule[0]?.buildingId;
      if (!buildingId) {
        Alert.alert('No route found', 'No buildings are scheduled today.');
        setScanned(false);
        return;
      }

      const started = startCleaningSession({ buildingId, qrScanId: raw || undefined });
      if (!started.ok) {
        Alert.alert('Unable to start', started.message);
        setScanned(false);
        return;
      }

      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      setTimeout(() => {
        setScanOpen(false);
        setScanned(false);
      }, 450);
    },
    [params.buildingId, resultAnim, scanned, schedule],
  );

  const recentCompleted = useMemo(() => {
    return logs
      .filter((l) => l.status === 'completed')
      .slice(0, 6)
      .map((l) => ({ ...l, key: `${l.id}` }));
  }, [logs]);

  async function onConfirmPhoto(uri: string) {
    if (!activeSession) return;
    if (!cameraArea) return;

    const area = cameraArea;
    const photo = await captureEvidencePhoto(uri, {
      area,
      buildingId: activeSession.buildingId,
      porterId: activeSession.porterId,
      checkInId: activeSession.checkInId,
    });
    addSessionPhoto(photo);

    setCameraArea(null);
  }

  return (
    <Screen
      scroll={false}
      overlay={
        activeSession ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: SPACING.screenX, bottom: 14 }}>
            <Badge label="Active session" tone="success" />
          </View>
        ) : null
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: c.textPrimary }}>Clean</Text>
        <Text style={{ ...TYPE.body, color: c.textSecondary }}>
          {formatWeekdayMonthDay(new Date().toISOString())} · {settings.requireQrCheckIn ? 'QR check-ins + timestamped evidence photos' : 'Timestamped evidence photos'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ gap: SPACING.cardGap, paddingBottom: 24 }}>
        {!activeSession ? (
          <>
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
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5',
                  borderWidth: 1,
                  borderColor: theme.isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.25)',
                }}
              >
                <Sparkles color={c.primary} size={28} />
              </View>
              <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: c.textPrimary }}>{settings.requireQrCheckIn ? 'Scan a QR code to start cleaning' : 'Start a cleaning session'}</Text>
              <Text style={{ ...TYPE.body, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                {selectedBuilding ? `Starting at ${selectedBuilding.buildingName}.` : '{settings.requireQrCheckIn ? 'Scan at the building entrance to create a proof-of-work check-in.' : 'Tap below to check in and start cleaning.'}'}
              </Text>

              <Pressable onPress={() => { if (settings.requireQrCheckIn) { setScanOpen(true); } else { const bid = selectedBuilding?.buildingId ?? schedule[0]?.buildingId; if (bid) { startCleaningSession({ buildingId: bid }); } } }} style={{ width: '100%' }}>
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: RADII.button,
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: c.primary,
                      opacity: pressed ? 0.9 : 1,
                      flexDirection: 'row',
                      gap: 10,
                    }}
                  >
                    {settings.requireQrCheckIn && <ScanLine color="#FFFFFF" size={18} />}
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>{settings.requireQrCheckIn ? 'Scan QR' : 'Start Cleaning'}</Text>
                  </View>
                )}
              </Pressable>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin color={c.textMuted} size={16} />
                  <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>GPS</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 color={c.textMuted} size={16} />
                  <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Timestamps</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>Recent completed logs</Text>
              {recentCompleted.length === 0 ? (
                <View
                  style={{
                    backgroundColor: c.card,
                    borderRadius: RADII.card,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: 16,
                    gap: 8,
                    ...theme.cardShadow,
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>No history yet</Text>
                  <Text style={{ ...TYPE.body, color: c.textSecondary }}>Complete a cleaning session to create a legal-grade record.</Text>
                </View>
              ) : (
                recentCompleted.map((l) => (
                  <View
                    key={l.key}
                    style={{
                      backgroundColor: c.card,
                      borderRadius: RADII.card,
                      borderWidth: 1,
                      borderColor: c.border,
                      padding: 14,
                      gap: 6,
                      ...theme.cardShadow,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }} numberOfLines={1}>
                        {l.buildingName} · {titleCaseArea(l.area)}
                      </Text>
                      <Badge label="Completed" tone="success" />
                    </View>
                    <Text style={{ ...TYPE.body, color: c.textSecondary }} numberOfLines={2}>
                      {l.address} • {formatDateShort(l.completedAt ?? l.checkedInAt)}
                    </Text>
                    <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>
                      Evidence photos: {l.photos.length}
                      {l.qrScanId ? ' • QR linked' : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            <View
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
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 18, color: c.textPrimary }} numberOfLines={1}>
                    {activeSession.buildingName}
                  </Text>
                  <Text style={{ ...TYPE.body, color: c.textSecondary }} numberOfLines={1}>
                    {activeSession.address}
                  </Text>
                </View>
                <Badge label="In Progress" tone="warning" />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Check-in: {formatDateShort(activeSession.checkedInAtISO)}</Text>
                <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.textMuted }}>Session: {activeSession.checkInId}</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>Areas</Text>

              {activeSession.areas.map((area) => {
                const checked = activeSession.checked[area];
                const evidenceCount = photosForArea(activeSession.photos, area);
                return (
                  <View
                    key={area}
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
                      <Pressable onPress={() => toggleAreaChecked(area)} style={{ flex: 1 }}>
                        {({ pressed }) => (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.92 : 1 }}>
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                borderWidth: 2,
                                borderColor: checked ? 'transparent' : c.border,
                                backgroundColor: checked ? c.primary : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {checked ? <CheckCircle2 color="#FFFFFF" size={16} /> : null}
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>
                                {titleCaseArea(area)}
                              </Text>
                              <Text style={{ ...TYPE.body, color: c.textSecondary }}>
                                Evidence photos: {evidenceCount}
                              </Text>
                            </View>
                          </View>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setCameraArea(area);
                          setCameraOpen(true);
                        }}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {({ pressed }) => (
                          <View
                            style={{
                              borderRadius: RADII.button,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              backgroundColor: checked ? c.primary : theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                              opacity: pressed ? 0.9 : 1,
                            }}
                          >
                            <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: checked ? '#FFFFFF' : c.textMuted }}>
                              Take Photo
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>Evidence photos</Text>

              {activeSession.photos.length === 0 ? (
                <View
                  style={{
                    backgroundColor: c.card,
                    borderRadius: RADII.card,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: 16,
                    gap: 8,
                    ...theme.cardShadow,
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>No photos yet</Text>
                  <Text style={{ ...TYPE.body, color: c.textSecondary }}>Take at least 1 photo per completed area to finish.</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {activeSession.photos.slice(0, 12).map((p) => (
                    <View
                      key={p.id}
                      style={{
                        width: '31%',
                        aspectRatio: 1,
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: c.border,
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      }}
                    >
                      <Image source={{ uri: p.uri }} style={{ flex: 1 }} resizeMode="cover" />
                      <View style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
                        <View
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            borderRadius: 10,
                            paddingVertical: 6,
                            paddingHorizontal: 8,
                            gap: 2,
                          }}
                        >
                          <Text style={{ fontFamily: FONT.semibold, fontSize: 11, color: '#FFFFFF' }} numberOfLines={1}>
                            {titleCaseArea(p.area)}
                          </Text>
                          <Text style={{ fontFamily: FONT.medium, fontSize: 10, color: 'rgba(255,255,255,0.75)' }} numberOfLines={1}>
                            {new Date(p.capturedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View
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
                <Text style={{ ...TYPE.sectionHeader, color: c.textPrimary }}>Notes</Text>
                <VoiceInput onTranscribe={(text) => setSessionNotes(activeSession.notes ? `${activeSession.notes} ${text}` : text)} />
              </View>
              <TextInput
                value={activeSession.notes}
                onChangeText={setSessionNotes}
                placeholder="Add notes (issues found, broken lights, spills, etc.)"
                placeholderTextColor={c.textMuted}
                multiline
                style={{
                  minHeight: 90,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: 12,
                  fontFamily: FONT.regular,
                  fontSize: 14,
                  color: c.textPrimary,
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                }}
              />
            </View>

            <Pressable
              onPress={() => {
                const res = canComplete({ areas: activeSession.areas, checked: activeSession.checked, photos: activeSession.photos });
                if (!res.ok) {
                  Alert.alert('Missing evidence', res.message);
                  return;
                }
                const done = completeCleaningSession();
                if (!done.ok) {
                  Alert.alert('Unable to complete', done.message);
                  return;
                }
                Alert.alert('Saved', `Completed cleaning with ${done.createdLogs} log${done.createdLogs === 1 ? '' : 's'}.`);
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: RADII.button,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: c.primary,
                    opacity: pressed ? 0.9 : 1,
                  }}
                >
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: '#FFFFFF' }}>Complete Cleaning</Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <ScanModal visible={scanOpen} onClose={() => { setScanOpen(false); setScanned(false); }} onScanned={scanned ? () => {} : onScanned} />

      <CameraCapture
        visible={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setCameraArea(null);
        }}
        onConfirmPhoto={async (uri) => {
          await onConfirmPhoto(uri);
          setCameraOpen(false);
        }}
      />

      {scanned ? (
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                },
              ],
              opacity: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
              backgroundColor: theme.isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5',
              borderRadius: 22,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: theme.isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.25)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircle2 color={c.primary} size={20} />
            <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textPrimary }}>Check-in saved</Text>
          </Animated.View>
        </View>
      ) : null}
    </Screen>
  );
}
