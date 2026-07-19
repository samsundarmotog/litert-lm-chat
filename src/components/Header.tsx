import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSettingsPress?: () => void;
  onNewChatPress?: () => void;
  statusDot?: 'ready' | 'loading' | 'generating' | 'offline';
}

const STATUS_COLORS = {
  ready: COLORS.success,
  loading: COLORS.warning,
  generating: COLORS.accentLight,
  offline: COLORS.error,
};

const STATUS_LABELS = {
  ready: 'On-Device',
  loading: 'Loading...',
  generating: 'Thinking...',
  offline: 'Offline',
};

export function Header({ title, subtitle, onSettingsPress, onNewChatPress, statusDot }: HeaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (statusDot === 'generating') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [statusDot, pulseAnim]);

  return (
    <BlurView intensity={60} tint="dark" style={styles.blur}>
      <LinearGradient
        colors={['rgba(10,10,15,0.95)', 'rgba(10,10,15,0.7)']}
        style={styles.container}
      >
        <View style={styles.left}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {statusDot && (
              <View style={styles.statusBadge}>
                <Animated.View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLORS[statusDot], opacity: pulseAnim },
                  ]}
                />
                <Text style={[styles.statusLabel, { color: STATUS_COLORS[statusDot] }]}>
                  {STATUS_LABELS[statusDot]}
                </Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actions}>
          {onNewChatPress && (
            <TouchableOpacity onPress={onNewChatPress} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.iconText}>✦</Text>
            </TouchableOpacity>
          )}
          {onSettingsPress && (
            <TouchableOpacity onPress={onSettingsPress} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.iconText}>⚙</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgCardBorder,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  left: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  iconText: { fontSize: 17, color: COLORS.textSecondary },
});
