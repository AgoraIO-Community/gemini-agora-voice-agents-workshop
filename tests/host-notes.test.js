import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({
  connect: vi.fn(), options: null
}));
vi.mock("../src/signaling.js", () => ({
  WorkshopSignaling: class {
    constructor(options) { transport.options = options; }
    connect(connection) { return transport.connect(connection); }
  }
}));
vi.mock("../src/notes-content.js", async (original) => ({
  ...await original(), sanitizeNotes: (html) => ({ safeNotes: html })
}));

class Element extends EventTarget {
  value = "";
  hidden = false;
  textContent = "";
  focus = vi.fn();
  replaceChildren = vi.fn();
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
let elements, document, window;

beforeEach(async () => {
  vi.resetModules();
  transport.connect.mockReset().mockResolvedValue({ userId: "notes-123456781234123412341234" });
  elements = Object.fromEntries(["join", "channel", "key", "reconnect", "companion", "error", "status", "position", "title", "timing", "notes", "next"].map(id => [id, new Element()]));
  document = Object.assign(new EventTarget(), { visibilityState: "visible", getElementById: id => elements[id] });
  window = Object.assign(new EventTarget(), { scrollTo: vi.fn() });
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", window);
  vi.stubGlobal("location", { search: "?channel=gemini-rehearsal" });
  await import("../src/host-notes.js");
});
afterEach(() => vi.unstubAllGlobals());

async function join() {
  elements.key.value = "private-password";
  elements.join.dispatchEvent(new Event("submit", { cancelable: true }));
  await settle();
}

describe("phone notes companion", () => {
  it("requires a password submit and keeps the desktop host identity separate", async () => {
    expect(elements.channel.value).toBe("gemini-rehearsal");
    expect(transport.connect).not.toHaveBeenCalled();
    await join();
    expect(transport.connect).toHaveBeenCalledWith(expect.objectContaining({ role: "notes", sessionId: "gemini-rehearsal", hostKey: "private-password" }));
    expect(elements.key.value).toBe("");
    expect(elements.join.hidden).toBe(true);
    expect(elements.companion.hidden).toBe(false);
  });

  it("reconnects with the same notes identity when the phone returns or the user retries", async () => {
    await join();
    transport.connect.mockClear();
    document.visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(transport.connect).not.toHaveBeenCalled();
    document.visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(transport.connect).toHaveBeenCalledWith(expect.objectContaining({ userId: "notes-123456781234123412341234", role: "notes" }));
    window.dispatchEvent(new Event("online"));
    await settle();
    elements.reconnect.dispatchEvent(new Event("click"));
    await settle();
    expect(transport.connect).toHaveBeenCalledTimes(3);
  });

  it("renders current notes and next slide and resets scroll only when the slide changes", async () => {
    await join();
    const detail = { version: 1, slideId: "discover-recipes", position: 10, total: 17, title: "Find your Gemini recipe", timing: "0:30", notesHtml: "<p>Show the catalog.</p>", nextTitle: "Initialize the recipe" };
    window.dispatchEvent(new CustomEvent("workshop:presentersnapshot", { detail }));
    expect(elements.position.textContent).toBe("Slide 10 of 17");
    expect(elements.title.textContent).toBe(detail.title);
    expect(elements.next.textContent).toBe("Next: Initialize the recipe");
    expect(elements.notes.replaceChildren).toHaveBeenCalledWith({ safeNotes: detail.notesHtml });
    window.dispatchEvent(new CustomEvent("workshop:presentersnapshot", { detail }));
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new CustomEvent("workshop:presentersnapshot", { detail: { ...detail, position: -1 } }));
    expect(elements.notes.replaceChildren).toHaveBeenCalledTimes(2);
  });

  it("asks for the password again if authentication expires", async () => {
    await join();
    transport.options.onStatus("error", { status: 401, message: "Invalid host key" });
    expect(elements.join.hidden).toBe(false);
    expect(elements.reconnect.hidden).toBe(true);
    transport.connect.mockClear();
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(transport.connect).not.toHaveBeenCalled();
  });
});
