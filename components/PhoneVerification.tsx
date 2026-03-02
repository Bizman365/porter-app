import { Phone, CheckCircle2, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../lib/colorScheme';
import { FONT, RADII, SPACING } from '../lib/theme';

type Props = {
  currentPhone: string;
  onPhoneVerified: (phone: string) => void;
};

export function PhoneVerification({ currentPhone, onPhoneVerified }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [phone, setPhone] = useState(currentPhone);
  const [editing, setEditing] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(!!currentPhone);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 1) return digits.length === 1 ? `+${digits}` : '';
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }

  function handlePhoneChange(text: string) {
    setPhone(formatPhone(text));
    setVerified(false);
  }

  async function sendVerificationCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setSending(true);
    // Simulate sending SMS
    const mockCode = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(mockCode);

    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);

    setCode(['', '', '', '', '', '']);
    setVerifyModalOpen(true);
    setCountdown(60);

    // In a real app this would call an API. For demo, show the code.
    Alert.alert('📱 Code Sent', `Verification code sent to ${phone}\n\nDemo code: ${mockCode}`);
  }

  function handleCodeInput(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    const full = newCode.join('');
    if (full.length === 6) {
      verifyCode(full);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verifyCode(entered: string) {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 800));
    setVerifying(false);

    if (entered === generatedCode) {
      setVerified(true);
      setVerifyModalOpen(false);
      onPhoneVerified(phone);
      Alert.alert('✅ Verified', 'Phone number has been verified and updated.');
    } else {
      Alert.alert('❌ Invalid Code', 'The code you entered is incorrect. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Phone Input */}
      <View style={{
        backgroundColor: c.card, borderRadius: RADII.card, padding: 16, gap: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Phone color={c.primary} size={20} />
          <Text style={{ fontFamily: FONT.semibold, fontSize: 15, color: c.textPrimary }}>Contact Number</Text>
          {verified && <CheckCircle2 color={c.success} size={16} />}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={c.textMuted}
            keyboardType="phone-pad"
            style={{
              flex: 1,
              fontFamily: FONT.medium,
              fontSize: 16,
              color: c.textPrimary,
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
              borderRadius: RADII.button,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          />
          {phone !== currentPhone && phone.replace(/\D/g, '').length >= 10 && (
            <Pressable onPress={sendVerificationCode} disabled={sending}>
              {({ pressed }) => (
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADII.button,
                  backgroundColor: c.primary, opacity: sending ? 0.6 : pressed ? 0.8 : 1,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}>
                  <Send color="#FFF" size={14} />
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: '#FFF' }}>
                    {sending ? 'Sending...' : 'Verify'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
        {!verified && phone && (
          <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: c.warning }}>
            ⚠️ Number not verified. Update and verify to receive notifications.
          </Text>
        )}
      </View>

      {/* Verification Code Modal */}
      <Modal visible={verifyModalOpen} transparent animationType="fade" onRequestClose={() => setVerifyModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: c.card, borderRadius: RADII.card, padding: 24, gap: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: c.textPrimary }}>Enter Verification Code</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>
              A 6-digit code was sent to{'\n'}
              <Text style={{ fontFamily: FONT.semibold, color: c.textPrimary }}>{phone}</Text>
            </Text>

            {/* 6-digit input */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  value={digit}
                  onChangeText={(v) => handleCodeInput(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={{
                    width: 44, height: 52, borderRadius: RADII.button,
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                    borderWidth: 2,
                    borderColor: digit ? c.primary : c.border,
                    textAlign: 'center',
                    fontFamily: FONT.bold,
                    fontSize: 22,
                    color: c.textPrimary,
                  }}
                />
              ))}
            </View>

            {verifying && (
              <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: c.primary }}>Verifying...</Text>
            )}

            {/* Resend */}
            <Pressable
              onPress={countdown > 0 ? undefined : sendVerificationCode}
              disabled={countdown > 0}
            >
              <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: countdown > 0 ? c.textMuted : c.primary }}>
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </Text>
            </Pressable>

            {/* Cancel */}
            <Pressable onPress={() => setVerifyModalOpen(false)}>
              {({ pressed }) => (
                <View style={{
                  paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADII.button,
                  borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.8 : 1,
                }}>
                  <Text style={{ fontFamily: FONT.semibold, fontSize: 14, color: c.textSecondary }}>Cancel</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
