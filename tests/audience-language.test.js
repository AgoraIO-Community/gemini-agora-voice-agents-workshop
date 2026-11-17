import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));

// Run the shipped initialization and snapshot handlers, with browser rendering stubbed.
function audience({ values = {}, blocked = false, isAudience = true } = {}) {
  const storage = new Map(Object.entries(values));
  const context = {
    isAudience,
    TRACKS: { nextjs: {}, python: {}, go: {} },
    DEFAULTS: { track: "nextjs", packageManager: "pnpm", architecture: "cascaded", theme: "auto", terminalEnvironment: "mac" },
    SHARED_CONFIG_KEYS: ["track", "packageManager", "architecture", "theme", "terminalEnvironment"],
    SHARED_CONFIG_ENUMS: { track: ["nextjs", "python", "go"], packageManager: ["pnpm", "bun", "make"], architecture: ["cascaded", "mllm"], theme: ["auto", "light", "dark"], terminalEnvironment: ["mac", "linux", "pc"] },
    TERMINAL_ENVIRONMENTS: { mac: {}, linux: {}, pc: {} },
    packageManagerForTrack: (track) => ({ nextjs: "pnpm", python: "bun", go: "make" })[track],
    localStorage: {
      getItem(key) { if (blocked) throw new Error("Storage denied"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error("Storage denied"); storage.set(key, value); }
    },
    renderAll: vi.fn(),
    current: 0,
    previous: 0,
    slideIndexById: { "install-cli": 1, "init-recipe": 2, "run-recipe": 3 }
  };
  runInNewContext([
    section("      function savedEnum(", "      var slides ="),
    section("      function applyWorkshopSnapshot(", "      function go(delta)"),
    section("      function setAudienceTrack(", '      document.getElementById("audienceTrackSelect").addEventListener')
  ].join("\n"), context);
  return { context, storage };
}
const snapshot = (slideId, track = "go") => ({ version: 1, slideId, config: { architecture: "mllm", track, packageManager: "make" } });

describe("audience code language", () => {
  it("defaults to TypeScript even when this browser previously presented a different track", () => {
    const { context } = audience({ values: { "agora-v2-track": "python" } });
    context.applyWorkshopSnapshot(snapshot("install-cli"));
    expect(context.state.track).toBe("nextjs");
    expect(context.state.packageManager).toBe("pnpm");
    expect(context.state.architecture).toBe("mllm");
    expect(context.current).toBe(1);
  });

  it.each(["python", "go"])("keeps %s through host slide changes, archives, and a reload", (track) => {
    const { context, storage } = audience();
    expect(context.setAudienceTrack(track)).toBe(true);
    context.applyWorkshopSnapshot(snapshot("init-recipe", "nextjs"));
    context.applyArchivedWorkshopSnapshot(snapshot("run-recipe", "nextjs"));
    expect(context.state.track).toBe(track);
    expect(context.state.packageManager).toBe(track === "python" ? "bun" : "make");
    expect(context.current).toBe(3);
    expect(audience({ values: Object.fromEntries(storage) }).context.state.track).toBe(track);
    expect(storage.has("agora-v2-track")).toBe(false);
  });

  it("ignores corrupt saved preferences and unsupported choices", () => {
    const { context } = audience({ values: { "agora-gemini-audience-track": "ruby" } });
    expect(context.state.track).toBe("nextjs");
    expect(context.setAudienceTrack("ruby")).toBe(false);
    expect(context.state.track).toBe("nextjs");
  });

  it("works for the current visit when browser storage is unavailable", () => {
    const { context } = audience({ blocked: true });
    expect(context.state.track).toBe("nextjs");
    expect(context.setAudienceTrack("python")).toBe(true);
    context.applyWorkshopSnapshot(snapshot("run-recipe"));
    expect(context.state.track).toBe("python");
  });

  it("leaves the presenter track independent of audience preferences", () => {
    const { context } = audience({ isAudience: false, values: { "agora-v2-track": "go", "agora-gemini-audience-track": "python" } });
    expect(context.state.track).toBe("go");
    expect(context.setAudienceTrack("python")).toBe(false);
  });
});
