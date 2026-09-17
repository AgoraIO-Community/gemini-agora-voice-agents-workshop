import type { RTMClient } from 'agora-rtm';
import type { Architecture, DemoModel, ThinkingLevel } from '@/lib/demo';

export interface AgoraTokenData {
  appId: string;
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
  architecture: Architecture;
  model?: DemoModel;
  thinking_level?: ThinkingLevel;
}

export interface StopConversationRequest {
  agent_id: string;
  architecture?: Architecture;
}

export interface AgentResponse {
  agent_id: string;
  architecture: Architecture;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

export interface ConversationComponentProps {
  agoraData: AgoraTokenData;
  architecture: Architecture;
  rtmClient: RTMClient;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  onEndConversation: () => void;
}
