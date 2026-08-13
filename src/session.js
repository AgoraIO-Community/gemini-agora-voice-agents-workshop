const CHANNEL_PATTERN = /^[a-z0-9][a-z0-9_-]{0,47}$/;

export function localDateKey(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildSessionId(date = new Date()) {
  return localDateKey(date);
}

export function normalizeSessionId(value) {
  const sessionId = String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
  return CHANNEL_PATTERN.test(sessionId) ? sessionId : null;
}

export function resolveSessionId(search = "", date = new Date()) {
  const override = new URLSearchParams(search).get("channel");
  if (override == null || override.trim() === "") return buildSessionId(date);
  return normalizeSessionId(override);
}

export function channelNameForSession(sessionId) {
  const normalized = normalizeSessionId(sessionId);
  if (!normalized) throw new Error("Invalid workshop session");
  return normalized;
}

export function audienceUrl(location) {
  const url = new URL("/", location.href);
  const override = new URL(location.href).searchParams.get("channel");
  url.search = "";
  if (override) {
    const normalized = normalizeSessionId(override);
    if (normalized) url.searchParams.set("channel", normalized);
  }
  url.hash = "";
  return url.href;
}
