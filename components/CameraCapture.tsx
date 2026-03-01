import { CameraView, type CameraType, type FlashMode, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '../lib/colorScheme';
import { FONT, RADII, SPACING } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirmPhoto: (uri: string) => void;
};

export function CameraCapture({ visible, onClose, onConfirmPhoto }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCapturedUri(null);
      setCapturing(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!permission) return;
    if (!permission.granted) requestPermission().catch(() => {});
  }, [permission, requestPermission, visible]);

  const flashLabel = useMemo(() => {
    if (flashMode === 'on') return 'Flash: On';
    if (flashMode === 'auto') return 'Flash: Auto';
    return 'Flash: Off';
  }, [flashMode]);

  async function takePhoto() {
    if (capturing) return;
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.75, exif: false });
      if (pic?.uri) setCapturedUri(pic.uri);
    } catch {
      // Ignore; user can retry.
    } finally {
      setCapturing(false);
    }
  }

  function cycleFlash() {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }

  function toggleFacing() {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Top bar */}
        <View
          style={{
            paddingTop: 52,
            paddingHorizontal: SPACING.screenX,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: '#FFFFFF' }}>Camera</Text>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <X color="#FFFFFF" size={22} />
          </Pressable>
        </View>

        {/* Body */}
        <View style={{ flex: 1 }}>
          {!permission ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Checking camera permissions…
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: SPACING.screenX }}>
              <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: '#FFFFFF', textAlign: 'center' }}>
                Camera access is required
              </Text>
              <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                Allow camera access to take before/after photos.
              </Text>
              <Pressable onPress={() => requestPermission().catch(() => {})}>
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: RADII.button,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: c.primary,
                      opacity: pressed ? 0.9 : 1,
                      minWidth: 170,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' }}>Allow Camera</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ) : capturedUri ? (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="contain" />
              <View
                style={{
                  padding: SPACING.screenX,
                  gap: 10,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                }}
              >
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => setCapturedUri(null)} style={{ flex: 1 }}>
                    {({ pressed }) => (
                      <View
                        style={{
                          borderRadius: RADII.button,
                          paddingVertical: 14,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.18)',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          opacity: pressed ? 0.9 : 1,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: '#FFFFFF' }}>Retake</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      onConfirmPhoto(capturedUri);
                      onClose();
                    }}
                    style={{ flex: 1 }}
                  >
                    {({ pressed }) => (
                      <View
                        style={{
                          borderRadius: RADII.button,
                          paddingVertical: 14,
                          alignItems: 'center',
                          backgroundColor: c.primary,
                          opacity: pressed ? 0.9 : 1,
                        }}
                      >
                        <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: '#FFFFFF' }}>Use Photo</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
              flash={flashMode}
            />
          )}
        </View>

        {/* Bottom controls */}
        {!capturedUri && permission?.granted ? (
          <View
            style={{
              paddingHorizontal: SPACING.screenX,
              paddingTop: 12,
              paddingBottom: 24,
              backgroundColor: 'rgba(0,0,0,0.55)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Pressable onPress={cycleFlash} hitSlop={12} disabled={capturing}>
              {({ pressed }) => (
                <View style={{ opacity: capturing ? 0.5 : pressed ? 0.85 : 1 }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: '#FFFFFF' }}>{flashLabel}</Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={takePhoto} disabled={capturing} hitSlop={12}>
              {({ pressed }) => (
                <View
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 39,
                    borderWidth: 4,
                    borderColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: capturing ? 0.7 : pressed ? 0.9 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 31,
                      backgroundColor: capturing ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
                    }}
                  />
                </View>
              )}
            </Pressable>

            <Pressable onPress={toggleFacing} hitSlop={12} disabled={capturing}>
              {({ pressed }) => (
                <View style={{ opacity: capturing ? 0.5 : pressed ? 0.85 : 1 }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: '#FFFFFF' }}>
                    {facing === 'back' ? 'Rear' : 'Front'}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
