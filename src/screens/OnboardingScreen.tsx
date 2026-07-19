/**
 * OnboardingScreen — First-run experience.
 * Showcases the on-device AI value proposition and leads to model selection.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../constants';

interface OnboardingScreenProps {
  onModelSelected: (name: string, path: string) => void;
}

const FEATURES = [
  { emoji: '🔒', title: '100% Private', desc: 'Your conversations never leave your device' },
  { emoji: '⚡', title: 'Instant Inference', desc: 'Metal GPU acceleration via LiteRT-LM' },
  { emoji: '✈️', title: 'Works Offline', desc: 'No internet required after download' },
];

export function OnboardingScreen({ onModelSelected }: OnboardingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, glowScale]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      console.log('[OnboardingScreen] DocumentPicker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('[OnboardingScreen] Asset picked:', asset);
        // Note: For actual usage with litert-lm on iOS, it often needs the file URI stripped of 'file://' 
        // or properly resolved, but we'll pass the uri directly first. 
        // The litert-lm native module can usually handle the local file URI or path.
        let path = asset.uri;
        if (path.startsWith('file://')) {
          path = path.replace('file://', '');
        }
        console.log('[OnboardingScreen] Final path being passed:', path);
        onModelSelected(asset.name, path);
      }
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bg, '#0F0F1A', COLORS.bg]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View
            style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Glow orb */}
            <Animated.View style={[styles.glowOrb, { transform: [{ scale: glowScale }] }]} />
            <View style={styles.logoMark}>
              <Text style={styles.logoEmoji}>✦</Text>
            </View>
            <Text style={styles.appName}>NanoChat</Text>
            <Text style={styles.tagline}>Private AI. On Your Device.</Text>
            <Text style={styles.description}>
              Powered by Google's LiteRT-LM runtime. Runs entirely on-device using{' '}
              <Text style={styles.highlight}>Metal GPU acceleration</Text> — no cloud, no API keys, no data collection.
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Model selection */}
          <Animated.View style={[styles.modelSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Load a Model</Text>
            <Text style={styles.sectionSubtitle}>
              Select a .bin or .gguf model file from your device storage to begin.
            </Text>

            <TouchableOpacity style={styles.pickButton} onPress={handlePickFile} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accent + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pickGradient}
              >
                <Text style={styles.pickButtonText}>Pick Local Model File</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  glowOrb: {
    position: 'absolute',
    top: 20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.accentGlow,
    // react-native blur substitute
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  logoEmoji: { fontSize: 32, color: COLORS.white },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  highlight: {
    color: COLORS.accentLight,
    fontWeight: '600',
  },
  features: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 36,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  featureEmoji: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  featureDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  modelSection: {
    paddingHorizontal: 24,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  pickButton: {
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pickGradient: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
