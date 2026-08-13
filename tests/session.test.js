import { describe, expect, it } from "vitest";
import { audienceUrl, buildSessionId, channelNameForSession, localDateKey, normalizeSessionId, resolveSessionId } from "../src/session.js";

describe("workshop session identity", () => {
  it("uses the host's local calendar date instead of UTC serialization", () => {
    const localDate = new Date(2026, 7, 12, 23, 58);
    expect(localDateKey(localDate)).toBe("2026-08-12");
    expect(buildSessionId(localDate)).toBe("2026-08-12");
  });

  it("uses the normalized local date as the RTM channel", () => {
    expect(normalizeSessionId(" 2026-08-12 ")).toBe("2026-08-12");
    expect(channelNameForSession("2026-08-12")).toBe("2026-08-12");
    expect(normalizeSessionId("../../another-channel")).toBeNull();
  });

  it("supports a normalized channel query override and otherwise falls back to the local date", () => {
    const localDate = new Date(2026, 7, 12, 23, 58);
    expect(resolveSessionId("?channel=SF%20Rehearsal", localDate)).toBe("sf-rehearsal");
    expect(resolveSessionId("", localDate)).toBe("2026-08-12");
    expect(resolveSessionId("?channel=../../other", localDate)).toBeNull();
  });

  it("builds a clean audience URL without session parameters", () => {
    const location = { href: "https://workshop.example/index.html?view=host#slide-install-cli" };
    expect(audienceUrl(location)).toBe("https://workshop.example/");
  });

  it("preserves a valid normalized channel override in an audience URL", () => {
    const location = { href: "https://workshop.example/?channel=SF%20Rehearsal#slide-install-cli" };
    expect(audienceUrl(location)).toBe("https://workshop.example/?channel=sf-rehearsal");
  });
});
