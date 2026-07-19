/**
 * ChatScreen — Main chat interface.
 * Streams LLM responses token-by-token using LiteRT-LM on-device inference.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MessageBubble } from '../components/MessageBubble';
import { COLORS } from '../constants';
import { useLLM } from '../hooks/useLLM';
import type { Message } from '../types';

interface ChatScreenProps {
  modelPath: string;
  modelName: string;
  onSettings: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

const SUGGESTED_PROMPTS = [
  '✦  Explain quantum computing simply',
  '✦  Write a haiku about autumn rain',
  '✦  Debug this: undefined is not a function',
  '✦  What\'s the capital of Iceland?',
];

export function ChatScreen({ modelPath, modelName, onSettings }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const sendScaleAnim = useRef(new Animated.Value(1)).current;
  const inputHeightAnim = useRef(new Animated.Value(0)).current;
  const streamingMsgIdRef = useRef<string | null>(null);

  const llm = useLLM();

  // Load model on mount
  useEffect(() => {
    console.log('[ChatScreen] Mounting with modelPath:', modelPath);
    llm.loadModel(modelPath).then((ok) => {
      console.log('[ChatScreen] loadModel finished with success:', ok);
      setIsModelReady(ok);
    }).catch(err => {
      console.error('[ChatScreen] loadModel threw an exception:', err);
    });
    // Release on unmount
    return () => { 
      console.log('[ChatScreen] Unmounting, releasing model');
      llm.releaseModel(); 
    };
  }, [modelPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const headerStatus = (() => {
    if (!isModelReady && llm.status !== 'error') return 'loading';
    if (llm.status === 'generating') return 'generating';
    if (isModelReady) return 'ready';
    return 'offline';
  })();

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !llm.isReady || llm.status === 'generating') return;

    setInputText('');
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Prepare streaming assistant message
    const assistantId = generateId();
    streamingMsgIdRef.current = assistantId;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Stream tokens
    const result = await llm.sendMessage(
      messages,
      text,
      (token: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m
          )
        );
        // Auto-scroll during streaming
        listRef.current?.scrollToEnd({ animated: false });
      },
    );

    // Mark streaming done, add tok/s
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, isStreaming: false, tokensPerSecond: result?.tokensPerSecond }
          : m
      )
    );
    streamingMsgIdRef.current = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [inputText, llm, messages]);

  const handleSendPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendScaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(sendScaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    sendMessage();
  }, [sendScaleAnim, sendMessage]);

  const startNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (llm.status === 'generating') {
      llm.stopGeneration();
    }
    setMessages([]);
    setInputText('');
  }, [llm]);

  const canSend = inputText.trim().length > 0 && llm.isReady && llm.status !== 'generating';

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0A12']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header
          title="NanoChat"
          subtitle={modelName}
          statusDot={headerStatus}
          onSettingsPress={onSettings}
          onNewChatPress={messages.length > 0 ? startNewChat : undefined}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {messages.length === 0 ? (
            <EmptyState
              isLoading={!isModelReady && !llm.error}
              errorMsg={llm.error}
              onSuggest={(p) => setInputText(p.replace(/^✦\s+/, ''))}
            />
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Input area */}
          <View style={styles.inputArea}>
            {llm.status === 'generating' && (
              <TouchableOpacity
                onPress={() => { llm.stopGeneration(); }}
                style={styles.stopBtn}
              >
                <Text style={styles.stopText}>■ Stop</Text>
              </TouchableOpacity>
            )}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isModelReady ? 'Message NanoChat...' : 'Loading model...'}
                placeholderTextColor={COLORS.textSecondary}
                multiline
                maxLength={2000}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
                editable={isModelReady}
              />
              <Animated.View style={{ transform: [{ scale: sendScaleAnim }] }}>
                <TouchableOpacity
                  onPress={handleSendPress}
                  disabled={!canSend}
                  style={[styles.sendBtn, canSend && styles.sendBtnActive]}
                >
                  {canSend ? (
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentLight]}
                      style={styles.sendBtnGradient}
                    >
                      <Text style={styles.sendIcon}>↑</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.sendBtnGradient, { backgroundColor: COLORS.surface }]}>
                      <Text style={[styles.sendIcon, { color: COLORS.textSecondary }]}>↑</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
            <Text style={styles.disclaimer}>
              Runs entirely on-device · LiteRT-LM · No data leaves your phone
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function EmptyState({
  isLoading,
  errorMsg,
  onSuggest,
}: {
  isLoading: boolean;
  errorMsg: string | null;
  onSuggest: (p: string) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyEmoji}>✦</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {errorMsg ? 'Error Loading Model' : isLoading ? 'Loading Model...' : 'How can I help?'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {errorMsg ? errorMsg : isLoading
          ? 'Initializing LiteRT-LM engine with Metal GPU...'
          : 'Try one of these or ask anything'}
      </Text>

      {!isLoading && !errorMsg && (
        <View style={styles.suggestionsGrid}>
          {SUGGESTED_PROMPTS.map((p, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onSuggest(p)}
              style={styles.suggestionBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageList: {
    paddingVertical: 16,
    paddingBottom: 8,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgCardBorder,
    gap: 6,
    backgroundColor: COLORS.bg + 'EE',
  },
  stopBtn: {
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 100,
  },
  stopText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendBtnActive: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  sendBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 28, color: COLORS.white },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  suggestionsGrid: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  suggestionBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
