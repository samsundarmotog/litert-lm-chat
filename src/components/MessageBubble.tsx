import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../constants';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

// Animated blinking cursor for streaming responses
function StreamingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 530, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 530, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.Text style={[styles.cursor, { opacity }]}>▋</Animated.Text>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isUser ? styles.wrapperUser : styles.wrapperAI,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>✦</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
          {message.content}
          {message.isStreaming && <StreamingCursor />}
        </Text>
        {!message.isStreaming && message.tokensPerSecond && !isUser && (
          <Text style={styles.tokenSpeed}>{message.tokensPerSecond} tok/s · On-Device</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    marginHorizontal: 16,
    gap: 10,
    maxWidth: '90%',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  wrapperAI: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 14, color: COLORS.white },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.aiBubble,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15.5,
    lineHeight: 23,
  },
  textUser: {
    color: COLORS.white,
    fontWeight: '400',
  },
  textAI: {
    color: COLORS.text,
    fontWeight: '400',
  },
  cursor: {
    color: COLORS.accentLight,
    fontSize: 14,
  },
  tokenSpeed: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
});
