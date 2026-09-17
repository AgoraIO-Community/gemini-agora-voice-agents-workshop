import { NextResponse } from 'next/server';
import { AgoraClient, Area, createPreviewRoute, generateConvoAIToken, PreviewFeatures } from 'agora-agents';
import type { StopConversationRequest } from '@/types/conversation';
import { requireAgoraCredentials } from '@/lib/env';
import { parseArchitecture } from '@/lib/demo';

function isAgentAlreadyStoppingOrStopped(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeErr = error as {
    statusCode?: number;
    body?: { detail?: string; reason?: string };
    message?: string;
  };

  const statusCode = maybeErr.statusCode;
  const reason = maybeErr.body?.reason?.toLowerCase();
  const detail = maybeErr.body?.detail?.toLowerCase() ?? maybeErr.message?.toLowerCase() ?? '';

  if (statusCode === 404) return true;
  if (reason === 'invalidrequest' && detail.includes('already in the process of shutting down')) {
    return true;
  }
  return false;
}

// Stateless stop: serverless instances don't share memory, so the agent is
// stopped by id. Gemini Live agents live behind the preview route and must be
// stopped through the same host and gate they were started with.
export async function POST(request: Request) {
  try {
    const body: StopConversationRequest = await request.json();
    const { agent_id } = body;
    const architecture = parseArchitecture(body.architecture);

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }

    const { appId, appCertificate } = requireAgoraCredentials();
    const client = new AgoraClient({ area: Area.US, appId, appCertificate });

    const token = generateConvoAIToken({ appId, appCertificate, channelName: 'stop', uid: 0 });
    const requestOptions = { headers: { Authorization: `agora token=${token}` } };
    const agents = architecture === 'mllm'
      ? createPreviewRoute(client, [PreviewFeatures.GeminiLive]).agents
      : client.agents;

    try {
      await agents.stop({ appid: appId, agentId: agent_id }, requestOptions);
    } catch (error) {
      if (isAgentAlreadyStoppingOrStopped(error)) {
        // Treat stop as idempotent: agent is already exiting (or gone).
        return NextResponse.json({ success: true, state: 'already-stopping' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop conversation' },
      { status: 500 },
    );
  }
}
