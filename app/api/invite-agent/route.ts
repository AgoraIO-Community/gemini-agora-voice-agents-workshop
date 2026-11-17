import { NextRequest, NextResponse } from 'next/server';
import { AgoraClient, Area, ExpiresIn } from 'agora-agents';
import type { AgentResponse, ClientStartRequest } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { requireAgoraCredentials, requireGoogleApiKey } from '@/lib/env';
import { cascadedAgent, mllmAgent } from '@/lib/demo-agents';
import { validateStartRequest, type Architecture } from '@/lib/demo';

// agentUid identifies the AI in the RTC channel — must match the client default.
const agentUid = String(DEFAULT_AGENT_UID);

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
