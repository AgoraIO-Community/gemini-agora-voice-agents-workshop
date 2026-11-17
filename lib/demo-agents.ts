import { Agent, AgoraClient, Gemini, GeminiLive, GeminiSTT, GeminiTTS, createPreviewRoute, PreviewFeatures } from 'agora-agents';
import type { GeminiThinkingLevel } from 'agora-agents';
import { adaPrompt, GREETING } from './agent-prompt';
import type { Architecture, DemoModel, ThinkingLevel } from './demo';

// Shared by both architectures: RTM data channel so the browser gets
// transcripts, metrics, and error events; chorus scenario for low latency.
const SHARED_AGENT_OPTIONS = {
  greeting: GREETING,
  failureMessage: 'Please wait a moment.',
  parameters: {
    audio_scenario: 'chorus',
    data_channel: 'rtm',
    enable_error_message: true,
    enable_metrics: true,
  },
} as const;

// A · Cascaded: GeminiSTT → Gemini 4 Hydrogen → Gemini TTS (preview).
export function cascadedAgent(client: AgoraClient, googleApiKey: string): Agent {
  const instructions = adaPrompt('cascaded');
  return new Agent({
    client,
    instructions,
    ...SHARED_AGENT_OPTIONS,
    turnDetection: {
      language: 'en-US',
      config: {
        speech_threshold: 0.5,
        start_of_speech: {
          mode: 'vad',
          vad_config: { interrupt_duration_ms: 160, prefix_padding_ms: 300 },
        },
        end_of_speech: {
          mode: 'vad',
          vad_config: { silence_duration_ms: 480 },
        },
      },
    },
    advancedFeatures: { enable_rtm: true, enable_tools: true },
  })
    .withStt(new GeminiSTT({
      apiKey: googleApiKey,
      languageCodes: ['en-US'],
      customVocabulary: ['Agora', 'Gemini'],
      wordTimestamp: false,
    }))
    .withLlm(new Gemini({
      apiKey: googleApiKey,
      model: 'gemini-4-hydrogen',
      // Keep Hydrogen's provider-default thinking; no legacy sampling overrides.
      systemMessages: [{ parts: [{ text: instructions }], role: 'user' }],
      greetingMessage: GREETING,
      failureMessage: 'Please wait a moment.',
      maxHistory: 15,
    }))
    .withTts(new GeminiTTS({
      apiKey: googleApiKey,
      model: 'gemini-3.8-flash-tts',
      voice: 'Puck',
      style: 'warm and reassuring',
    }));
}

// B · Native multimodal: Gemini 3.8 Live does ASR + LLM + TTS in one model.
export function mllmAgent(client: AgoraClient, googleApiKey: string, model: DemoModel, thinkingLevel?: ThinkingLevel): Agent {
  return new Agent({
    client,
    ...SHARED_AGENT_OPTIONS,
    // Tools are disabled for this preview (no MCP tool invocation).
    advancedFeatures: { enable_rtm: true, enable_tools: false },
  }).withMllm(new GeminiLive({
    apiKey: googleApiKey,
    model,
    voice: 'Puck',
    languageCodes: ['en-US'],
    thinkingLevel: thinkingLevel as GeminiThinkingLevel | undefined,
    // The system prompt must go on the vendor — agent-level `instructions`
    // only applies to the cascading pipeline's llm.system_messages.
    instructions: adaPrompt('mllm'),
    // MLLM has no ASR stage, so these flags are the only source of
    // transcript events for the browser transcript panel.
    transcribeAgent: true,
    transcribeUser: true,
    // Vendor-side VAD; overrides top-level turn_detection when MLLM is on.
    turnDetection: { mode: 'server_vad' },
  }));
}

// SDK 2.11 routes Gemini TTS through preview; Gemini Live uses production.
// Stops must use the same route as starts in stateless serverless deployments.
export function demoAgentClient(client: AgoraClient, architecture: Architecture) {
  return architecture === 'cascaded'
    ? createPreviewRoute(client, [PreviewFeatures.GeminiLive]).agents
    : client.agents;
}
