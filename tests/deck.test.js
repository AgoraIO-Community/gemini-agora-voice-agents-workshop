import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("workshop deck structure", () => {
  it("places the cascading Conversational AI pipeline between Channels and Agents", () => {
    const channels = html.indexOf('data-slide-id="channels"');
    const pipeline = html.indexOf('data-slide-id="conversational-ai-pipeline"');
    const agents = html.indexOf('data-slide-id="agents"');

    expect(channels).toBeGreaterThan(-1);
    expect(pipeline).toBeGreaterThan(channels);
    expect(agents).toBeGreaterThan(pipeline);
  });

  it("describes both directions of the SDRTN voice cascade", () => {
    expect(html).toContain("User device");
    expect(html).toContain("Audio stream");
    expect(html).toContain("ASR");
    expect(html).toContain("Transcript text");
    expect(html).toContain("LLM");
    expect(html).toContain("Response text");
    expect(html).toContain("TTS");
    expect(html).toContain("Synthesized audio stream");
    expect(html).toContain("Agora SDRTN®");
  });

  it("uses stable slide IDs for stage navigation", () => {
    expect(html).toContain('{ 1: "choose-template", 2: "customize-prompt", 3: "add-telephone-number"');
    expect(html).toContain('{ 1: "install-cli", 2: "initialize-quickstart", 3: "run-quickstart"');
    expect(html).not.toMatch(/slideTargets\s*=\s*\{\s*1:\s*\d/);
  });

  it("keeps configurable venue Wi-Fi details host-only", () => {
    expect(html).toContain('id="wifiNameInput"');
    expect(html).toContain('id="wifiPasswordInput"');
    expect(html).toContain('id="frontWifiDetails"');
    expect(html).toContain('sessionStorage.getItem("agora-v2-wifi-password")');

    const sharedKeys = html.slice(html.indexOf("var SHARED_CONFIG_KEYS"), html.indexOf("var SHARED_CONFIG_ENUMS"));
    expect(sharedKeys).not.toContain("wifiName");
    expect(sharedKeys).not.toContain("wifiPassword");
  });
});
