import { describe, expect, it, vi } from "vitest";
import { createPhoneClaimResponse } from "../api/phone-number-claim.js";

const env = {
  PHONE_CLAIM_API_TOKEN: "server-only-token",
  PHONE_CLAIM_API_URL: "https://claims.example.test/api/event-number-claims"
};

function upstream(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

function claimResponse() {
  return {
    data: {
      claim_id: "claim-1",
      claimed_at: "2026-08-12T21:30:00.000Z",
      phone_number: "+14155550123",
      sip: {
        id: "3024517476126819868",
        name: "Agora Demo US Inbound",
        type: "fqdn_connection",
        active: true,
        sip_server: "sip.telnyx.com",
        sip_port: 5060,
        tls_port: 5061,
        agora_origination_uri: "sip:sbc-us-west-1.viblinx.com:5060",
        agora_outbound_source_ips: ["49.51.250.59", "49.51.250.76"],
        sip_subdomain: "agora-us-2.sip.telnyx.com"
      }
    }
  };
}

describe("phone number claim proxy", () => {
  it("keeps authorization server-side and maps the upstream SIP assignment", async () => {
    const fetchImpl = vi.fn(async () => upstream(claimResponse()));
    const result = await createPhoneClaimResponse({ email: " Attendee@Example.com ", eventName: "SFWRKSHP26" }, env, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(env.PHONE_CLAIM_API_URL, {
      method: "POST",
      headers: { authorization: "Bearer server-only-token", "content-type": "application/json" },
      body: JSON.stringify({ email: "attendee@example.com", event_name: "SFWRKSHP26" })
    });
    expect(result).toEqual({
      status: 200,
      body: {
        data: {
          claimId: "claim-1",
          claimedAt: "2026-08-12T21:30:00.000Z",
          phoneNumber: "+14155550123",
          sip: {
            provider: "Telnyx",
            displayName: "Agora Demo Number",
            server: "agora-us-2.sip.telnyx.com",
            transport: "tcp",
            connectionType: "fqdn_connection",
            credentialsRequired: false,
            username: "",
            password: "",
            port: 5060,
            tlsPort: 5061
          }
        }
      }
    });
    expect(JSON.stringify(result.body)).not.toContain("sbc-us-west-1");
    expect(JSON.stringify(result.body)).not.toContain("49.51.250.59");
  });

  it("validates email and event name before calling upstream", async () => {
    const fetchImpl = vi.fn();
    expect((await createPhoneClaimResponse({ email: "bad", eventName: "SFWRKSHP26" }, env, fetchImpl)).status).toBe(400);
    expect((await createPhoneClaimResponse({ email: "a@example.com", eventName: "../../other" }, env, fetchImpl)).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed when the server token is absent", async () => {
    const result = await createPhoneClaimResponse({ email: "a@example.com", eventName: "SFWRKSHP26" }, {}, vi.fn());
    expect(result).toEqual({ status: 503, body: { error: "Phone number claims are not configured" } });
  });

  it("surfaces safe upstream errors and rejects incomplete assignments", async () => {
    const rejected = await createPhoneClaimResponse(
      { email: "a@example.com", eventName: "SFWRKSHP26" }, env,
      vi.fn(async () => upstream({ error: "No numbers remain" }, false, 409))
    );
    expect(rejected).toEqual({ status: 409, body: { error: "No numbers remain" } });

    const incomplete = await createPhoneClaimResponse(
      { email: "a@example.com", eventName: "SFWRKSHP26" }, env,
      vi.fn(async () => upstream({ data: { phone_number: "+1", sip: {} } }))
    );
    expect(incomplete.status).toBe(502);
  });

  it("continues to normalize credential-based SIP connections", async () => {
    const body = claimResponse();
    body.data.sip = {
      name: "Credential SIP",
      type: "credential_connection",
      username: "event-user",
      password: "event-password",
      sip_server: "sip.example.com",
      sip_port: 5060,
      tls_port: 5061,
      encrypted_media: true
    };

    const result = await createPhoneClaimResponse(
      { email: "a@example.com", eventName: "SFWRKSHP26" }, env,
      vi.fn(async () => upstream(body))
    );

    expect(result.body.data.sip).toMatchObject({
      provider: "Credential SIP",
      server: "sip.example.com",
      transport: "tls",
      connectionType: "credential_connection",
      credentialsRequired: true,
      username: "event-user",
      password: "event-password"
    });
  });
});
