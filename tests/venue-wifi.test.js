import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { createWorkshopArchive } from "../src/archive.js";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const setupCode = html.slice(html.indexOf("      function setupVenueWifi()"), html.indexOf("      function showToast(message)"));
function storage(initial = {}, blocked = false) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: vi.fn(key => { if (blocked) throw Error("Denied"); return values.get(key) || null; }),
    setItem: vi.fn((key, value) => { if (blocked) throw Error("Denied"); values.set(key, value); }),
    removeItem: vi.fn(key => { if (blocked) throw Error("Denied"); values.delete(key); })
  };
}
function setup({ isAudience = false, local = {}, session = {}, blocked = false } = {}) {
  const nodes = Object.fromEntries(["frontWifiDetails", "frontWifiName", "frontWifiPassword", "wifiNameInput", "wifiPasswordInput"].map(id => [id, { value: "", textContent: "", hidden: false, handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; } }]));
  const localStorage = storage(local, blocked);
  const sessionStorage = storage(session, blocked);
  const context = { isAudience, localStorage, sessionStorage, document: { getElementById: id => nodes[id] } };
  runInNewContext(setupCode + "\nvar wifi = setupVenueWifi();", context);
  function input(id, value) { nodes[id].handlers.input({ target: { value } }); }
  return { nodes, localStorage, sessionStorage, context, input };
}

describe("presenter venue Wi-Fi", () => {
  it("starts hidden with empty defaults, then shows edited details as text", () => {
    const { nodes, input } = setup();
    expect(nodes.frontWifiDetails.hidden).toBe(true);
    input("wifiNameInput", "Event Wi-Fi");
    input("wifiPasswordInput", "<secret>&password");
    expect(nodes.frontWifiDetails.hidden).toBe(false);
    expect(nodes.frontWifiName.textContent).toBe("Event Wi-Fi");
    expect(nodes.frontWifiPassword.textContent).toBe("<secret>&password");
  });

  it("persists the network locally and the password only in the current session", () => {
    const first = setup();
    first.input("wifiNameInput", "Venue");
    first.input("wifiPasswordInput", "session-only");
    expect(first.localStorage.values.get("agora-v2-wifi-name")).toBe("Venue");
    expect(first.localStorage.values.has("agora-v2-wifi-password")).toBe(false);
    expect(first.sessionStorage.values.get("agora-v2-wifi-password")).toBe("session-only");
    const reload = setup({ local: Object.fromEntries(first.localStorage.values), session: Object.fromEntries(first.sessionStorage.values) });
    expect(reload.nodes.wifiPasswordInput.value).toBe("session-only");
    const laterSession = setup({ local: Object.fromEntries(first.localStorage.values) });
    expect(laterSession.nodes.wifiNameInput.value).toBe("Venue");
    expect(laterSession.nodes.wifiPasswordInput.value).toBe("");
    reload.context.wifi.reset();
    expect(reload.nodes.frontWifiDetails.hidden).toBe(true);
    expect(reload.sessionStorage.values.size).toBe(0);
  });

  it("never reads or displays stored venue credentials in the audience view", () => {
    const { nodes, localStorage, sessionStorage } = setup({ isAudience: true, local: { "agora-v2-wifi-name": "Venue" }, session: { "agora-v2-wifi-password": "private" } });
    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(sessionStorage.getItem).not.toHaveBeenCalled();
    expect(nodes.frontWifiDetails.hidden).toBe(true);
    expect(nodes.frontWifiPassword.textContent).toBe("");
  });

  it("keeps working for the current visit when browser storage is unavailable", () => {
    const { nodes, input } = setup({ blocked: true });
    input("wifiNameInput", "Venue");
    input("wifiPasswordInput", "temporary");
    expect(nodes.frontWifiPassword.textContent).toBe("temporary");
  });

  it("excludes venue settings from live snapshot keys and audience archives", () => {
    const keys = runInNewContext(html.match(/var SHARED_CONFIG_KEYS = (\[[^;]+\]);/)[1]);
    expect(keys).not.toContain("wifiName");
    expect(keys).not.toContain("wifiPassword");
    const archive = createWorkshopArchive("gemini", { version: 1, slideId: "welcome", config: { architecture: "cascaded", track: "nextjs", wifiName: "Venue", wifiPassword: "private" } });
    expect(JSON.stringify(archive)).not.toMatch(/Venue|private|wifi/);
  });
});
