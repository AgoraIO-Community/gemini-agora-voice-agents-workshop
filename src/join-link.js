import QRCode from "qrcode";
import { audienceUrl } from "./session.js";

export function normalizeJoinUrl(value) {
  if (!value || typeof value !== "string") return "";
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Workshop join URL must be an HTTPS URL without credentials.");
  }
  return url.href;
}

export function resolveJoinUrl(configuredUrl, location) {
  // Rehearsal channels must send scanners to the same session as the presenter.
  const directUrl = audienceUrl(location);
  if (new URL(directUrl).searchParams.has("channel")) return directUrl;
  return normalizeJoinUrl(configuredUrl) || directUrl;
}

export async function renderJoinLink(document, location, configuredUrl, configuredQrUrl = "") {
  const url = resolveJoinUrl(configuredUrl, location);
  document.querySelectorAll("[data-workshop-join]").forEach((link) => { link.href = url; });
  document.querySelectorAll("[data-workshop-join-label]").forEach((label) => {
    label.textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  });
  const qrUrl = resolveJoinUrl(configuredQrUrl, location);
  const dataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: "M", margin: 4, scale: 8,
    color: { dark: "#000000", light: "#ffffff" }
  });
  document.querySelectorAll("[data-workshop-qr]").forEach((image) => { image.src = dataUrl; });
}
