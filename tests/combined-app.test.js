import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const recipeCode = html.slice(html.indexOf("      var RECIPES ="), html.indexOf("      function packageManagerForTrack"));
const commandCode = html.slice(html.indexOf("      function commandFor(step)"), html.indexOf("      function renderCommand"));
const context = {
  TRACKS: { nextjs: { label: "TypeScript" }, python: { label: "Python" }, go: { label: "Go" } },
  ARCHITECTURES: { cascaded: { dir: "gemini-voice-agent" }, mllm: { dir: "gemini-live-agent" } },
  state: { track: "nextjs", architecture: "mllm" }
};
runInNewContext(recipeCode + "\n" + commandCode, context);

describe("one app with both architectures", () => {
  it.each(["nextjs", "python", "go"])("infers the project language regardless of the %s slide selection", track => {
    const prompt = context.combinedAppPromptFor(track);
    expect(prompt).toContain("Infer the language, framework, and tooling from the current project");
    expect(prompt).toBe(context.combinedAppPromptFor("nextjs"));
    expect(prompt).not.toMatch(/TypeScript|Python|Next.js/);
    expect(prompt).toContain("do not create a second app");
    expect(prompt).toContain("Stop the active session before switching");
    expect(prompt).toContain("BOTH modes");
  });

  it.each([["nextjs", "pnpm install", "pnpm dev"], ["python", "bun run setup", "bun run dev"], ["go", "make setup", "make dev"]])("keeps %s baseline commands cascaded even when the host demo is native", (track, install, run) => {
    context.state.track = track;
    expect(context.commandFor("enter")).toBe("cd gemini-voice-agent");
    expect(context.commandFor("install")).toBe(install);
    expect(context.commandFor("run")).toBe(run);
    expect(html).toContain('initCommandFor("cascaded", state.track)');
  });
});
