import { AgoraClient, Area, PreviewFeatures } from 'agora-agents';
import { cascadedAgent, mllmAgent, demoAgentClient } from '../lib/demo-agents';
import { describe, expect, it } from "vitest";
import { ARCHITECTURES, DEMO_MODELS, parseArchitecture, validateStartRequest } from "../lib/demo";

describe("demo architectures", () => {
  it("offers exactly the two architectures the deck teaches", () => {
    expect(Object.keys(ARCHITECTURES)).toEqual(["cascaded", "mllm"]);
    expect(ARCHITECTURES.cascaded.stages.map((s) => s.key)).toEqual(["stt", "llm", "tts"]);
    expect(ARCHITECTURES.mllm.stages.map((s) => s.key)).toEqual(["mllm"]);
  });

  it("falls back to cascaded for unknown query values", () => {
    expect(parseArchitecture("mllm")).toBe("mllm");
    expect(parseArchitecture("nope")).toBe("cascaded");
    expect(parseArchitecture(undefined)).toBe("cascaded");
  });
});

describe("invite-agent request validation", () => {
  it("accepts a cascaded start with no model fields", () => {
    expect(validateStartRequest({ architecture: "cascaded" })).toEqual({
      ok: true, architecture: "cascaded", model: DEMO_MODELS.live, thinkingLevel: undefined
    });
  });

  it("defaults Gemini Live to the base model and medium thinking for extended thinking", () => {
    expect(validateStartRequest({ architecture: "mllm" })).toMatchObject({ ok: true, model: DEMO_MODELS.live, thinkingLevel: undefined });
    expect(validateStartRequest({ architecture: "mllm", model: DEMO_MODELS.extendedThinking })).toMatchObject({ ok: true, thinkingLevel: "medium" });
    expect(validateStartRequest({ architecture: "mllm", model: DEMO_MODELS.extendedThinking, thinking_level: "high" })).toMatchObject({ ok: true, thinkingLevel: "high" });
  });

  it("rejects unknown models and thinking levels that do not apply", () => {
    expect(validateStartRequest({ architecture: "mllm", model: "gpt-4o" })).toEqual({ ok: false, error: "Invalid model" });
    expect(validateStartRequest({ architecture: "mllm", model: DEMO_MODELS.live, thinking_level: "high" })).toEqual({ ok: false, error: "Invalid thinking level for model" });
    expect(validateStartRequest({ architecture: "cascaded", thinking_level: "low" })).toEqual({ ok: false, error: "Invalid thinking level for model" });
  });
});

describe("embedded recipe providers and lifecycle routes", () => {
  const client = new AgoraClient({ appId: "test-app-id", appCertificate: "test-certificate", area: Area.US });

  it("configures the verified Gemini speech pipeline and its preview gate", () => {
    const config = cascadedAgent(client, "test-google-key").config;
    expect(config.stt).toMatchObject({ vendor: "gemini" });
    expect(config.tts).toMatchObject({
      vendor: "gemini",
      params: { api_key: "test-google-key", model: "gemini-3.8-flash-tts", voice: "Puck", style: "warm and reassuring" }
    });
    expect(ARCHITECTURES.cascaded.stages[2].label).toBe("Gemini TTS");
  });

  it.each([DEMO_MODELS.live, DEMO_MODELS.extendedThinking])("keeps native model %s on production", (model) => {
    const config = mllmAgent(client, "test-google-key", model, model === DEMO_MODELS.extendedThinking ? "high" : undefined).config;
    expect(config.mllm).toMatchObject({ vendor: "gemini", params: { model } });
    expect(config.tts).toBeUndefined();
  });

  it.each(["cascaded", "mllm"] as const)("stops %s using its matching start route", async (architecture) => {
    let requestUrl = "";
    let feature: string | null = null;
    const stoppingClient = new AgoraClient({
      appId: "a".repeat(32), appCertificate: "b".repeat(32), area: Area.US,
      fetch: async (input, init) => {
        requestUrl = String(input);
        feature = new Headers(init?.headers).get("agora-feature");
        return new Response(JSON.stringify({ agent_id: "test-agent", create_ts: 1, state: "RUNNING" }), { status: 200, headers: { "content-type": "application/json" } });
      }
    });
    const agent = architecture === "cascaded"
      ? cascadedAgent(stoppingClient, "test-google-key")
      : mllmAgent(stoppingClient, "test-google-key", DEMO_MODELS.live);
    await agent.createSession({ channel: "test", agentUid: "1", remoteUids: ["2"] }).start();
    const startOrigin = new URL(requestUrl).origin;
    const startFeature = feature;
    await demoAgentClient(stoppingClient, architecture).stop({ appid: "test-app-id", agentId: "test-agent" });
    expect(new URL(requestUrl).origin).toBe(startOrigin);
    expect(feature).toBe(startFeature);
    if (architecture === "cascaded") {
      expect(requestUrl).toContain("partner.ai.agora.io/preview/");
      expect(feature).toBe(PreviewFeatures.GeminiLive);
    } else {
      expect(requestUrl).not.toContain("/preview/");
      expect(feature).toBeNull();
    }
  });
});
