/**
 * NanoChat — On-Device LLM Chat powered by Google LiteRT-LM
 *
 * App navigation flow:
 *   Onboarding → Download → Chat ⇄ Settings
 *
 * The entire LLM inference pipeline runs locally on the device via:
 *   react-native-litert-lm (Nitro Modules) → LiteRT-LM Swift API → Metal GPU
 */

import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants';
import { ChatScreen } from './src/screens/ChatScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { AppScreen } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('onboarding');
  const [modelName, setModelName] = useState<string>('Custom Model');
  const [modelPath, setModelPath] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const transition = useCallback(
    (nextScreen: AppScreen, cb?: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        cb?.();
        setScreen(nextScreen);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  const handleModelSelected = useCallback(
    (name: string, path: string) => {
      transition('chat', () => {
        setModelName(name);
        setModelPath(path);
      });
    },
    [transition]
  );

  const handleUnloadModel = useCallback(() => {
    transition('onboarding', () => setModelPath(null));
  }, [transition]);

  const handleChangeModel = useCallback(() => {
    transition('onboarding', () => setModelPath(null));
  }, [transition]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
          {screen === 'onboarding' && (
            <OnboardingScreen onModelSelected={handleModelSelected} />
          )}

          {screen === 'chat' && modelPath && (
            <ChatScreen
              modelPath={modelPath}
              modelName={modelName}
              onSettings={() => transition('settings')}
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              activeModelName={modelName}
              activeModelPath={modelPath!}
              onBack={() => transition('chat')}
              onUnloadModel={handleUnloadModel}
              onChangeModel={handleChangeModel}
            />
          )}
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
