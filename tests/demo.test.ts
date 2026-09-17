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
