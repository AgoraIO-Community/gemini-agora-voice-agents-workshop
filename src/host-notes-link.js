/** Add a same-channel phone link without copying the presenter's password. */
export function setupHostNotesLink({ document, location, sessionId, clipboard = globalThis.navigator?.clipboard }) {
  const link = document.getElementById("hostNotesLink");
  const copy = document.getElementById("copyHostNotesLink");
  if (!link || !sessionId) return;
  const url = new URL("/host-notes", location.origin);
  url.searchParams.set("channel", sessionId);
  link.href = url.href;
  link.textContent = "Open phone notes";
  copy?.addEventListener("click", async () => {
    try {
      await clipboard.writeText(url.href);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Copy the link above";
    }
  });
}
