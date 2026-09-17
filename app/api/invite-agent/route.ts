import { NextRequest, NextResponse } from 'next/server';
import {
  Agent,
  AgoraClient,
  Area,
  ExpiresIn,
  Gemini,
  GeminiLive,
  GeminiSTT,
  MiniMaxTTS,
} from 'agora-agents';
import type { GeminiThinkingLevel } from 'agora-agents';
import type { AgentResponse, ClientStartRequest } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { requireAgoraCredentials, requireGoogleApiKey } from '@/lib/env';
import { adaPrompt, GREETING } from '@/lib/agent-prompt';
import { validateStartRequest, type Architecture, type DemoModel, type ThinkingLevel } from '@/lib/demo';

// agentUid identifies the AI in the RTC channel — must match the client default.
const agentUid = String(DEFAULT_AGENT_UID);

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

// A · Cascaded: GeminiSTT → Gemini 3.6 Flash → Agora-managed MiniMax TTS.
function cascadedAgent(client: AgoraClient, googleApiKey: string): Agent {
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
      model: 'gemini-3.6-flash',
      systemMessages: [{ parts: [{ text: instructions }], role: 'user' }],
      greetingMessage: GREETING,
      failureMessage: 'Please wait a moment.',
      maxHistory: 15,
    }))
    .withTts(new MiniMaxTTS({
      model: 'speech_2_6_turbo',
      voiceId: 'English_captivating_female1',
    }));
}

// B · Native multimodal: Gemini 3.8 Live does ASR + LLM + TTS in one model.
function mllmAgent(client: AgoraClient, googleApiKey: string, model: DemoModel, thinkingLevel?: ThinkingLevel): Agent {
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

export async function POST(request: NextRequest) {
  try {
    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

    if (!channel_name || !requester_id) {
      return NextResponse.json({ error: 'channel_name and requester_id are required' }, { status: 400 });
    }
    const start = validateStartRequest(body as unknown as Record<string, unknown>);
    if (!start.ok) return NextResponse.json({ error: start.error }, { status: 400 });

    // Validate env on first request so misconfiguration surfaces as a clear error.
    const { appId, appCertificate } = requireAgoraCredentials();
    const googleApiKey = requireGoogleApiKey();

    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({ area: Area.US, appId, appCertificate });
    const architecture: Architecture = start.architecture;
    const agent = architecture === 'mllm'
      ? mllmAgent(client, googleApiKey, start.model, start.thinkingLevel)
      : cascadedAgent(client, googleApiKey);

    // remoteUids restricts the agent to only process audio from this user.
    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false,
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      architecture,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start conversation' },
      { status: 500 },
    );
  }
}
