const DEFAULT_CLAIM_API_URL = "https://carrot-seven.vercel.app/api/event-number-claims";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function providerName(sip) {
  const host = `${text(sip?.sip_subdomain)} ${text(sip?.sip_server)}`.toLowerCase();
  if (host.includes("telnyx")) return "Telnyx";
  return text(sip?.name) || "SIP Connection";
}

function normalizeClaim(data) {
  const claim = data?.data;
  const sip = claim?.sip;
  const phoneNumber = text(claim?.phone_number);
  const server = text(sip?.sip_subdomain) || text(sip?.sip_server);
  const connectionType = text(sip?.type);
  const username = text(sip?.username);
  const password = text(sip?.password);
  const credentialsRequired = connectionType !== "fqdn_connection";
  if (!phoneNumber || !server || (credentialsRequired && (!username || !password))) return null;

  const encrypted = Boolean(sip?.encrypted_media);
  return {
    claimId: text(claim.claim_id),
    claimedAt: text(claim.claimed_at),
    phoneNumber,
    sip: {
      provider: providerName(sip),
      displayName: "Agora Demo Number",
      server,
      transport: encrypted ? "tls" : "tcp",
      connectionType,
      credentialsRequired,
      username,
      password,
      port: Number.isInteger(sip.sip_port) ? sip.sip_port : null,
      tlsPort: Number.isInteger(sip.tls_port) ? sip.tls_port : null
    }
  };
}

export async function createPhoneClaimResponse(body, env = process.env, fetchImpl = globalThis.fetch) {
  const email = text(body?.email).toLowerCase();
  const eventName = text(body?.eventName);
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { status: 400, body: { error: "Enter a valid email address" } };
  }
  if (!EVENT_NAME_PATTERN.test(eventName)) {
    return { status: 400, body: { error: "The workshop claim event is invalid" } };
  }

  const token = text(env.PHONE_CLAIM_API_TOKEN);
  if (!token) return { status: 503, body: { error: "Phone number claims are not configured" } };

  let response;
  try {
    response = await fetchImpl(env.PHONE_CLAIM_API_URL || DEFAULT_CLAIM_API_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ email, event_name: eventName })
    });
  } catch {
    return { status: 502, body: { error: "Unable to reach the phone number service" } };
  }

  const upstream = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = text(upstream?.error) || text(upstream?.message) || "Unable to claim a phone number";
    return { status: response.status >= 400 && response.status < 500 ? response.status : 502, body: { error: message } };
  }

  const claim = normalizeClaim(upstream);
  if (!claim) return { status: 502, body: { error: "The phone number service returned incomplete SIP details" } };
  return { status: 200, body: { data: claim } };
}

export default async function handler(request, response) {
  response.setHeader("cache-control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const result = await createPhoneClaimResponse(request.body || {});
  return response.status(result.status).json(result.body);
}
