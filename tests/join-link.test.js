import { describe, expect, it, vi } from "vitest";
import { normalizeJoinUrl, resolveJoinUrl, renderJoinLink } from "../src/join-link.js";

vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn(async (url) => "data:image/png;base64," + url) } }));

const location = { href: "https://gemini.example/host?view=host#slide-install-cli" };
describe("workshop join link and QR destination", () => {
  it("uses the configured new shortlink", () => {
    expect(resolveJoinUrl("https://bit.ly/new-workshop", location)).toBe("https://bit.ly/new-workshop");
  });
  it("falls back to this deployment's audience URL without host parameters", () => {
    expect(resolveJoinUrl("", location)).toBe("https://gemini.example/");
  });
  it("preserves a rehearsal channel instead of sending scanners to another session", () => {
    expect(resolveJoinUrl("https://bit.ly/new-workshop", { href: "https://gemini.example/host?view=host&channel=SF%20Rehearsal" })).toBe("https://gemini.example/?channel=sf-rehearsal");
  });
  it.each(["javascript:alert(1)", "http://bit.ly/insecure", "https://user:pass@bit.ly/private", "not a url"])("rejects unsafe join config %s", (url) => {
    expect(() => normalizeJoinUrl(url)).toThrow();
  });
});

it("renders the same destination in every join link, label, and QR", async () => {
  const links = [{}, {}];
  const labels = [{}, {}];
  const images = [{}];
  const document = { querySelectorAll: (selector) => ({
    "[data-workshop-join]": links,
    "[data-workshop-join-label]": labels,
    "[data-workshop-qr]": images
  })[selector] };
  await renderJoinLink(document, location, "https://bit.ly/gemini-inperson");
  expect(links.every((link) => link.href === "https://bit.ly/gemini-inperson")).toBe(true);
  expect(labels.every((label) => label.textContent === "bit.ly/gemini-inperson")).toBe(true);
  expect(images[0].src).toBe("data:image/png;base64,https://bit.ly/gemini-inperson");
});
