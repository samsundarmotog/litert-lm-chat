// Model registry — all models are in .litertlm format hosted on HuggingFace
export const MODELS = [
  {
    id: 'gemma-4-2b-int4',
    name: 'Gemma 4 2B',
    variant: 'INT4 · Recommended',
    description: 'Fast, efficient. Best for everyday conversations on iPhone 12+.',
    sizeGB: 1.4,
    sizeMB: 1434,
    // Download from Google's official HuggingFace repo
    url: 'https://huggingface.co/google/gemma-4-2b-it-litert-lm/resolve/main/gemma-4-2b-it-int4.litertlm',
    filename: 'gemma-4-2b-int4.litertlm',
    minRamGB: 4,
    recommended: true,
    color: '#7C3AED',
  },
  {
    id: 'gemma-4-2b-int8',
    name: 'Gemma 4 2B',
    variant: 'INT8 · Higher Quality',
    description: 'Better quality responses. Requires iPhone 14+ with 6GB RAM.',
    sizeGB: 2.7,
    sizeMB: 2765,
    url: 'https://huggingface.co/google/gemma-4-2b-it-litert-lm/resolve/main/gemma-4-2b-it-int8.litertlm',
    filename: 'gemma-4-2b-int8.litertlm',
    minRamGB: 6,
    recommended: false,
    color: '#2563EB',
  },
] as const;

export type ModelConfig = (typeof MODELS)[number];

export const DEFAULT_MODEL = MODELS[0];

export const SYSTEM_PROMPT = `You are NanoChat, a helpful and concise AI assistant running entirely on this device. 
Your responses are private — no data leaves the phone. 
Be helpful, accurate, and direct. Keep responses reasonably concise unless detail is requested.`;

export const COLORS = {
  bg: '#0A0A0F',
  bgCard: '#12121A',
  bgCardBorder: '#1E1E2E',
  surface: '#1A1A28',
  surfaceBorder: '#2A2A3E',
  accent: '#7C3AED',
  accentLight: '#9D5FFF',
  accentGlow: 'rgba(124, 58, 237, 0.3)',
  text: '#F0F0FF',
  textSecondary: '#8888AA',
  textMuted: '#4444666',
  userBubble: '#7C3AED',
  aiBubble: '#1A1A28',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
};
