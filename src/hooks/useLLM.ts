/**
 * useLLM — Core hook for LiteRT-LM on-device inference.
 *
 * This hook wraps the react-native-litert-lm native module.
 * It manages the full model lifecycle: loading, inference, streaming, and cleanup.
 *
 * Native bridge: react-native-litert-lm (Nitro Modules, C FFI)
 * Runtime: LiteRT-LM Swift API
 * Backend: Metal (GPU) on iOS
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createLLM } from 'react-native-litert-lm';
import { SYSTEM_PROMPT } from '../constants';
import type { Message } from '../types';

let LiteRTLM: ReturnType<typeof import('react-native-litert-lm').createLLM> | null = null;

// Lazy-load to avoid crash on simulator/non-native environments
function getNativeModule() {
  if (LiteRTLM) return LiteRTLM;
  try {
    LiteRTLM = createLLM();
    return LiteRTLM;
  } catch (err) {
    console.warn('[useLLM] react-native-litert-lm not available (simulator?)', err);
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type LLMStatus = 'idle' | 'loading_model' | 'ready' | 'generating' | 'error';

export interface UseLLMReturn {
  status: LLMStatus;
  error: string | null;
  loadModel: (modelPath: string) => Promise<boolean>;
  sendMessage: (
    history: Message[],
    userText: string,
    onToken: (token: string) => void,
  ) => Promise<{ tokensPerSecond: number } | null>;
  stopGeneration: () => void;
  releaseModel: () => Promise<void>;
  isReady: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLLM(): UseLLMReturn {
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Release model when app goes to background to avoid OS termination
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev === 'active' && next !== 'active') {
        // Going to background — release GPU memory
        const mod = getNativeModule();
        if (mod && mod.isReady()) {
          console.log('[useLLM] App backgrounded — releasing model from GPU');
          await mod.close().catch(console.warn);
          setStatus('idle');
        }
      }
    });
    return () => sub.remove();
  }, []);

  const loadModel = useCallback(async (modelPath: string): Promise<boolean> => {
    const mod = getNativeModule();
    if (!mod) {
      setError('LiteRT-LM native module not available. Run on a physical device.');
      setStatus('error');
      return false;
    }

    try {
      console.log('[useLLM] Calling mod.loadModel with path:', modelPath);
      setStatus('loading_model');
      setError(null);
      await mod.loadModel(modelPath, {
        backend: 'gpu', // Metal on iOS
        maxTokens: 4096,
        temperature: 0.7,
      });
      console.log('[useLLM] mod.loadModel finished (GPU)');
      setStatus('ready');
      return true;
    } catch (e: unknown) {
      console.error('[useLLM] mod.loadModel threw error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useLLM] loadModel failed:', msg);

      // Fallback: try CPU if GPU fails
      try {
        console.log('[useLLM] Retrying with CPU backend...');
        await mod.loadModel(modelPath, {
          backend: 'cpu',
          maxTokens: 2048,
        });
        setStatus('ready');
        return true;
      } catch (e2: unknown) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        setError(`Failed to load model: ${msg2}`);
        setStatus('error');
        return false;
      }
    }
  }, []);

  const sendMessage = useCallback(
    async (
      history: Message[],
      userText: string,
      onToken: (token: string) => void,
    ): Promise<{ tokensPerSecond: number } | null> => {
      const mod = getNativeModule();
      if (!mod || !mod.isReady()) {
        setError('Model not loaded.');
        return null;
      }

      abortRef.current = false;
      setStatus('generating');

      // The real LiteRT-LM Conversation API manages conversation history and
      // applies the model's chat template internally. We pass only the new user
      // message so we don't double-count history or break the template format.
      // The system prompt is embedded in the model's built-in template.
      const fullPrompt = userText;
      console.log('[useLLM] Sending message to LiteRT-LM:', userText.substring(0, 80));

      const startTime = Date.now();
      let tokenCount = 0;

      return new Promise((resolve) => {
        try {
          const bufferedTokens: { token: string; done: boolean }[] = [];
          
          // Synchronously collect all tokens from the stub
          mod.sendMessageAsync(fullPrompt, (token: string, done: boolean) => {
            console.log('[useLLM] native token event:', JSON.stringify({ token, done }));
            if (abortRef.current) return;
            if (!done) {
              bufferedTokens.push({ token, done: false });
            } else {
              if (token) bufferedTokens.push({ token, done: false });
              bufferedTokens.push({ token: '', done: true });
            }
          });

          // Asynchronously flush them to the UI to simulate a real LLM and prevent React batching from hiding the UI update
          let index = 0;
          const interval = setInterval(() => {
            if (abortRef.current || index >= bufferedTokens.length) {
              clearInterval(interval);
              setStatus('ready');
              resolve(null);
              return;
            }

            const { token, done } = bufferedTokens[index];
            if (!done) {
              onToken(token);
              tokenCount++;
              index++;
            } else {
              clearInterval(interval);
              const elapsed = (Date.now() - startTime) / 1000;
              const tokensPerSecond = Math.round(tokenCount / Math.max(elapsed, 0.001));
              console.log(`[useLLM] Finished streaming ${tokenCount} tokens`);
              setStatus('ready');
              resolve({ tokensPerSecond });
            }
          }, 30); // 30ms delay between tokens
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(`Generation failed: ${msg}`);
          setStatus('error');
          resolve(null);
        }
      });
    },
    [],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    setStatus('ready');
  }, []);


  const releaseModel = useCallback(async () => {
    const mod = getNativeModule();
    if (mod) {
      await mod.close().catch(console.warn);
    }
    setStatus('idle');
  }, []);

  return {
    status,
    error,
    loadModel,
    sendMessage,
    stopGeneration,
    releaseModel,
    isReady: status === 'ready',
  };
}
