import { Audio } from 'expo-av';
import { Mic, Square } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, View } from 'react-native';

import { useTheme } from '../lib/colorScheme';
import { useTranslation } from '../lib/i18n';

type Props = {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
  language?: 'en' | 'es';
};

function getWhisperConfig() {
  const endpoint = (process.env.EXPO_PUBLIC_WHISPER_ENDPOINT || 'https://api.openai.com').trim().replace(/\/$/, '');
  const apiKey = (process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const isLocal = !endpoint.includes('openai.com');
  return { endpoint, apiKey, isLocal };
}

export function VoiceInput({ onTranscribe, disabled, language }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { locale } = useTranslation();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;

  const lang = useMemo(() => language ?? (locale === 'es' ? 'es' : 'en'), [language, locale]);

  useEffect(() => {
    if (!recording) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, recording]);

  async function start() {
    if (disabled || busy) return;
    try {
      setBusy(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone Required', 'Allow microphone access to use voice input.');
        return;
      }

      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
    } catch (e) {
      Alert.alert('Recording Failed', e instanceof Error ? e.message : 'Unable to start recording.');
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!recording || busy) return;
    const { endpoint, apiKey, isLocal } = getWhisperConfig();
    if (!isLocal && !apiKey) {
      Alert.alert('Missing API Key', 'Set EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_WHISPER_ENDPOINT for local Whisper.');
      return;
    }

    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('Missing recording URI.');

      const form = new FormData();
      form.append('language', lang);
      (form as any).append('file', {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      });

      // Local Whisper doesn't need model param or auth header
      if (!isLocal) {
        form.append('model', 'whisper-1');
      }

      const headers: Record<string, string> = {};
      if (!isLocal && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(`${endpoint}/v1/audio/transcriptions`, {
        method: 'POST',
        headers,
        body: form,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const text = String(json?.text ?? '').trim();
      if (text) onTranscribe(text);
    } catch (e) {
      Alert.alert('Transcription Failed', e instanceof Error ? e.message : 'Unable to transcribe right now.');
    } finally {
      setBusy(false);
    }
  }

  const isRecording = !!recording;

  return (
    <Pressable
      onPress={isRecording ? stop : start}
      disabled={disabled || busy}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRecording ? 'rgba(239,68,68,0.18)' : theme.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isRecording ? 'rgba(239,68,68,0.35)' : c.border,
        }}
      >
        {busy ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <>
            {isRecording ? <Square color="#EF4444" size={18} /> : <Mic color={c.primary} size={18} />}
            {isRecording ? (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: 'rgba(239,68,68,0.35)',
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] }),
                  transform: [
                    {
                      scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
                    },
                  ],
                }}
              />
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}
