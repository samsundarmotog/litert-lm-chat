/**
 * SettingsScreen — Model management, memory info, and app info.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
interface SettingsScreenProps {
  activeModelName: string;
  activeModelPath: string;
  onBack: () => void;
  onUnloadModel: () => void;
  onChangeModel: () => void;
}

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive, chevron }: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
      activeOpacity={0.6}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowEmoji}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && { color: COLORS.error }]}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {chevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export function SettingsScreen({
  activeModelName,
  activeModelPath,
  onBack,
  onUnloadModel,
  onChangeModel,
}: SettingsScreenProps) {
  const handleUnload = () => {
    Alert.alert(
      'Unload Model',
      `This will remove ${activeModelName} from the current session. The file will remain on your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unload',
          style: 'destructive',
          onPress: onUnloadModel,
        },
      ]
    );
  };

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0A12']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Active model */}
          <Section title="Active Model">
            <SettingsRow icon="🧠" label={activeModelName} value="Local File" />
            <View style={styles.divider} />
            <SettingsRow icon="📂" label="Model Path" value={activeModelPath} />
          </Section>

          {/* Runtime info */}
          <Section title="Runtime">
            <SettingsRow icon="⚡" label="Runtime" value="LiteRT-LM" />
            <View style={styles.divider} />
            <SettingsRow icon="🎮" label="Backend" value="Metal GPU (iOS)" />
            <View style={styles.divider} />
            <SettingsRow icon="🔒" label="Privacy" value="100% On-Device" />
            <View style={styles.divider} />
            <SettingsRow icon="📦" label="Model Format" value=".litertlm" />
          </Section>

          {/* Actions */}
          <Section title="Model Management">
            <SettingsRow
              icon="🔄"
              label="Change Model"
              onPress={onChangeModel}
              chevron
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="🗑️"
              label="Unload Model"
              onPress={handleUnload}
              destructive
            />
          </Section>

          {/* About */}
          <Section title="About">
            <SettingsRow icon="ℹ️" label="NanoChat" value="v1.0.0" />
            <View style={styles.divider} />
            <SettingsRow icon="🤖" label="Powered by" value="Google LiteRT-LM" />
            <View style={styles.divider} />
            <SettingsRow icon="🌐" label="Models from" value="HuggingFace" />
          </Section>

          {/* Privacy banner */}
          <View style={styles.privacyBanner}>
            <LinearGradient
              colors={[COLORS.accent + '22', COLORS.accentLight + '11']}
              style={styles.privacyGradient}
            >
              <Text style={styles.privacyTitle}>🔒 Your Conversations Stay Here</Text>
              <Text style={styles.privacyDesc}>
                NanoChat runs entirely on your device. No messages, prompts, or responses are sent to any server.
                There are no analytics, no telemetry, and no cloud dependencies after the initial model download.
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgCardBorder,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  backText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    padding: 20,
    gap: 24,
    paddingBottom: 60,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 17 },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  chevron: { fontSize: 20, color: COLORS.textSecondary },
  divider: {
    height: 1,
    backgroundColor: COLORS.bgCardBorder,
    marginLeft: 62,
  },
  privacyBanner: { borderRadius: 18, overflow: 'hidden' },
  privacyGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    borderRadius: 18,
    gap: 8,
  },
  privacyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  privacyDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
