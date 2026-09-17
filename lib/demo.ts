// The two ways an Agora voice agent can be structured. The deck, the demo UI,
// and the invite-agent route all key off these ids, so they never drift apart.

export const ARCHITECTURES = {
  cascaded: {
    id: 'cascaded',
    letter: 'A',
    label: 'Cascaded',
    title: 'Gemini ASR → Gemini 3.6 Flash → TTS',
    blurb: 'Three stages chained in one session: speech in, text through Flash, speech back out. Per-stage latency shows in the metrics panel.',
    stages: [
      { key: 'stt', label: 'Gemini ASR', metricTypes: ['stt', 'asr'] },
      { key: 'llm', label: 'Gemini LLM', metricTypes: ['llm'] },
      { key: 'tts', label: 'MiniMax TTS', metricTypes: ['tts'] },
    ],
  },
  mllm: {
    id: 'mllm',
    letter: 'B',
    label: 'Gemini Live',
    title: 'Gemini 3.8 Live, audio to audio',
    blurb: 'One native multimodal model listens and speaks. Try the extended-thinking variant and move the thinking-level slider.',
    stages: [
      { key: 'mllm', label: 'Gemini 3.8 Live', metricTypes: ['mllm', 'llm'] },
    ],
  },
} as const;

export type Architecture = keyof typeof ARCHITECTURES;
export const ARCHITECTURE_IDS = Object.keys(ARCHITECTURES) as Architecture[];
export const DEFAULT_ARCHITECTURE: Architecture = 'cascaded';

export function isArchitecture(value: unknown): value is Architecture {
  return typeof value === 'string' && value in ARCHITECTURES;
}

export function parseArchitecture(value: unknown, fallback: Architecture = DEFAULT_ARCHITECTURE): Architecture {
  return isArchitecture(value) ? value : fallback;
}

export const DEMO_MODELS = {
  live: 'models/gemini-3.8-live',
  extendedThinking: 'models/gemini-3.8-live-extended-thinking',
} as const;
export type DemoModel = (typeof DEMO_MODELS)[keyof typeof DEMO_MODELS];
export type ThinkingLevel = 'low' | 'medium' | 'high';
export const THINKING_LEVELS: ThinkingLevel[] = ['low', 'medium', 'high'];

export function isDemoModel(value: unknown): value is DemoModel {
  return value === DEMO_MODELS.live || value === DEMO_MODELS.extendedThinking;
}

export function isThinkingLevel(value: unknown): value is ThinkingLevel {
  return THINKING_LEVELS.includes(value as ThinkingLevel);
}

// Validates the body of POST /api/invite-agent. Pure so it can be unit tested.
export function validateStartRequest(body: Record<string, unknown>):
  | { ok: true; architecture: Architecture; model: DemoModel; thinkingLevel?: ThinkingLevel }
  | { ok: false; error: string } {
  const architecture = parseArchitecture(body.architecture);
  const model = body.model === undefined ? DEMO_MODELS.live : body.model;
  if (!isDemoModel(model)) return { ok: false, error: 'Invalid model' };
  const thinking = body.thinking_level;
  if (thinking !== undefined && (architecture !== 'mllm' || model !== DEMO_MODELS.extendedThinking || !isThinkingLevel(thinking))) {
    return { ok: false, error: 'Invalid thinking level for model' };
  }
  return {
    ok: true,
    architecture,
    model,
    thinkingLevel: model === DEMO_MODELS.extendedThinking ? (isThinkingLevel(thinking) ? thinking : 'medium') : undefined,
  };
}
