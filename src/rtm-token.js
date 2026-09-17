import crypto from "node:crypto";
import AgoraToken from "agora-token";
import { createAudienceUserId, isAudienceUserId } from "../src/identity.js";
import { channelNameForSession, normalizeSessionId } from "../src/session.js";

const { RtmTokenBuilder } = AgoraToken;
const TOKEN_TTL_SECONDS = 60 * 60;
const DEFAULT_HOST_KEY = "AgoraWorkshop2026";

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createTokenResponse({ sessionId, role, hostKey, userId: requestedUserId }, env = process.env, randomUUID = crypto.randomUUID) {
  const normalized = normalizeSessionId(sessionId);
  if (!normalized) return { status: 400, body: { error: "Invalid workshop session" } };
  if (role !== "host" && role !== "audience") return { status: 400, body: { error: "Invalid workshop role" } };

  const appId = env.NEXT_PUBLIC_AGORA_APP_ID || env.AGORA_APP_ID;
  const appCertificate = env.NEXT_AGORA_APP_CERTIFICATE || env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) return { status: 503, body: { error: "Agora environment is not configured" } };

  if (role === "host") {
    const configuredHostKey = env.WORKSHOP_HOST_KEY || DEFAULT_HOST_KEY;
    if (!secureEqual(hostKey, configuredHostKey)) {
      return { status: 401, body: { error: "Invalid host key" } };
    }
  } else if (requestedUserId && !isAudienceUserId(requestedUserId)) {
    return { status: 400, body: { error: "Invalid audience user ID" } };
  }

  const channelName = channelNameForSession(normalized);
  const hostUserId = `host-${normalized}`;
  const userId = role === "host" ? hostUserId : (requestedUserId || createAudienceUserId(randomUUID));
  const token = RtmTokenBuilder.buildToken(appId, appCertificate, userId, TOKEN_TTL_SECONDS);

  return {
    status: 200,
    body: {
      appId,
      token,
      userId,
      hostUserId,
      channelName,
      expiresIn: TOKEN_TTL_SECONDS
    }
  };
}
