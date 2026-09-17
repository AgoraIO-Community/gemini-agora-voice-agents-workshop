import { describe, expect, it, vi } from "vitest";
import {
  WORKSHOP_ARCHIVE_KEY,
  createWorkshopArchive,
  loadWorkshopArchive,
  saveWorkshopArchive,
  workshopArchiveSummary
} from "../src/archive.js";

function snapshot(overrides = {}) {
  return {
    version: 1,
    slideId: "live-demo",
    config: {
      architecture: "cascaded",
      track: "python",
      packageManager: "bun",
      theme: "dark",
      terminalEnvironment: "mac",
      googleApiKey: "private-google-secret",
      ...overrides
    }
  };
}

describe("audience livestream archive", () => {
  it("keeps presentation choices, starts at welcome, and drops unknown keys", () => {
    const archive = createWorkshopArchive("2026-09-03", snapshot(), new Date("2026-09-03T16:00:00.000Z"));

    expect(archive).toMatchObject({
      version: 1,
      sessionId: "2026-09-03",
      savedAt: "2026-09-03T16:00:00.000Z",
      snapshot: {
        version: 1,
        slideId: "welcome",
        config: { architecture: "cascaded", track: "python", packageManager: "bun", theme: "dark", terminalEnvironment: "mac" }
      }
    });
    expect(archive.snapshot.config).not.toHaveProperty("googleApiKey");
    expect(JSON.stringify(archive)).not.toContain("private-google-secret");
  });

  it("derives the package manager from the track even when tampered", () => {
    const archive = createWorkshopArchive("2026-09-03", snapshot({ packageManager: "make" }));
    expect(archive.snapshot.config.packageManager).toBe("bun");
  });

  it("saves and loads the most recent valid archive", () => {
    const values = new Map();
    const storage = {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => values.set(key, value))
    };
    const archive = createWorkshopArchive("2026-09-03", snapshot());

    expect(saveWorkshopArchive(storage, archive)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(WORKSHOP_ARCHIVE_KEY, expect.any(String));
    expect(loadWorkshopArchive(storage)).toEqual(archive);
  });

  it("ignores corrupt or incomplete local data", () => {
    expect(loadWorkshopArchive({ getItem: () => "not json" })).toBeNull();
    expect(createWorkshopArchive("2026-09-03", snapshot({ architecture: "studio" }))).toBeNull();
    expect(createWorkshopArchive("2026-09-03", snapshot({ track: "rust" }))).toBeNull();
    expect(saveWorkshopArchive({ setItem: () => { throw new Error("blocked"); } }, createWorkshopArchive("2026-09-03", snapshot()))).toBe(false);
  });

  it("formats the saved architecture, code track, and package manager", () => {
    expect(workshopArchiveSummary(createWorkshopArchive("2026-09-03", snapshot()))).toBe("Cascaded · Python · Bun");
    expect(workshopArchiveSummary(createWorkshopArchive("2026-09-03", snapshot({ architecture: "mllm", track: "go" })))).toBe("Gemini Live · Go · Make");
  });
});
