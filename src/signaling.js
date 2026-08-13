import AgoraRTM from "agora-rtm";
import { channelNameForSession, normalizeSessionId } from "./session.js";

export const MESSAGE_TYPES = Object.freeze({
  request: "workshop.state.request",
  snapshot: "workshop.state.snapshot"
});

function decodeMessage(message) {
  if (typeof message === "string") return message;
  if (message instanceof Uint8Array) return new TextDecoder().decode(message);
  return null;
}

export class WorkshopSignaling {
  constructor({
    presentation,
    fetchImpl = (...args) => globalThis.fetch(...args),
    eventTarget = globalThis.window,
    createClient = (appId, userId) => new AgoraRTM.RTM(appId, userId, { logLevel: "warn", presenceTimeout: 15 }),
    onStatus = () => {}
  }) {
    this.presentation = presentation;
    this.fetchImpl = fetchImpl;
    this.eventTarget = eventTarget;
    this.createClient = createClient;
    this.onStatus = onStatus;
    this.client = null;
    this.connection = null;
    this.connected = false;
    this.broadcasting = true;
    this.stateChangeHandler = () => this.queueSnapshot();
    this.snapshotTimer = null;
  }

  async fetchCredentials({ sessionId, role, hostKey, userId }) {
    const response = await this.fetchImpl("/api/rtm-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, role, hostKey, userId })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || "Unable to join workshop session");
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async connect({ sessionId, role, hostKey = "", userId = "" }) {
    const normalized = normalizeSessionId(sessionId);
    if (!normalized) throw new Error("Invalid workshop session");
    if (role !== "host" && role !== "audience") throw new Error("Invalid workshop role");
    if (this.client) await this.disconnect();

    this.onStatus("connecting");
    const credentials = await this.fetchCredentials({ sessionId: normalized, role, hostKey, userId });
    const expectedChannel = channelNameForSession(normalized);
    const identityMismatch = role === "host"
      ? credentials.userId !== credentials.hostUserId
      : Boolean(userId && credentials.userId !== userId);
    if (credentials.channelName !== expectedChannel || credentials.userId !== String(credentials.userId) || identityMismatch) {
      throw new Error("Token response did not match the workshop session");
    }

    const client = this.createClient(credentials.appId, credentials.userId);
    this.client = client;
    this.connection = { ...credentials, sessionId: normalized, role, hostKey, userId: credentials.userId };
    client.addEventListener("message", (event) => this.handleMessage(event));
    client.addEventListener("presence", (event) => this.handlePresence(event));
    client.addEventListener("status", (event) => this.handleStatus(event));

    let loggedIn = false;
    let subscribeAttempted = false;
    try {
      await client.login({ token: credentials.token });
      loggedIn = true;
      subscribeAttempted = true;
      await client.subscribe(credentials.channelName, { withMessage: true, withPresence: true });
    } catch (error) {
      if (subscribeAttempted) await client.unsubscribe(credentials.channelName).catch(() => {});
      if (loggedIn) await client.logout().catch(() => {});
      this.client = null;
      this.connection = null;
      this.onStatus("error", error);
      throw error;
    }

    this.connected = true;
    this.broadcasting = true;
    this.onStatus("connected");
    if (role === "host") {
      this.eventTarget.addEventListener(this.presentation.stateChangeEvent, this.stateChangeHandler);
      await this.publishSnapshot();
    } else {
      await client.publish(credentials.channelName, JSON.stringify({ type: MESSAGE_TYPES.request, version: 1 }), {
        customType: MESSAGE_TYPES.request
      });
    }
    return credentials;
  }

  async handleMessage(event) {
    if (!this.connected || !this.connection || event.channelName !== this.connection.channelName) return;
    const message = decodeMessage(event.message);
    if (!message) return;

    let payload;
    try { payload = JSON.parse(message); } catch { return; }

    if (this.connection.role === "audience") {
      if (event.publisher !== this.connection.hostUserId || event.customType !== MESSAGE_TYPES.snapshot) return;
      if (payload.type !== MESSAGE_TYPES.snapshot || payload.version !== 1) return;
      this.eventTarget.dispatchEvent(new CustomEvent("workshop:remotesnapshot", { detail: payload.snapshot }));
      return;
    }

    if (this.broadcasting && event.customType === MESSAGE_TYPES.request && payload.type === MESSAGE_TYPES.request) {
      await this.publishSnapshot();
    }
  }

  async handlePresence(event) {
    if (!this.connected || !this.broadcasting || this.connection?.role !== "host") return;
    if (event.eventType === "JOIN" || (event.eventType === "INTERVAL" && event.joinedUsers?.length)) {
      await this.publishSnapshot();
    }
  }

  async handleStatus(event) {
    const state = String(event?.state || "");
    const reason = String(event?.reason || "").toLowerCase();
    if (state === "TOKEN_EXPIRED" || reason.includes("token expired")) {
      try {
        const credentials = await this.fetchCredentials(this.connection);
        this.connection = { ...this.connection, ...credentials };
        await this.client.login({ token: credentials.token });
        this.onStatus("connected");
      } catch (error) {
        this.onStatus("error", error);
      }
      return;
    }
    this.onStatus(state.toLowerCase(), event);
  }

  queueSnapshot() {
    if (!this.connected || !this.broadcasting || this.connection?.role !== "host") return;
    clearTimeout(this.snapshotTimer);
    this.snapshotTimer = setTimeout(() => this.publishSnapshot().catch((error) => this.onStatus("error", error)), 80);
  }

  async publishSnapshot() {
    if (!this.connected || !this.broadcasting || this.connection?.role !== "host") return;
    const payload = {
      type: MESSAGE_TYPES.snapshot,
      version: 1,
      snapshot: this.presentation.getSnapshot()
    };
    await this.client.publish(this.connection.channelName, JSON.stringify(payload), {
      customType: MESSAGE_TYPES.snapshot
    });
  }

  setBroadcasting(enabled) {
    const next = Boolean(enabled);
    if (this.broadcasting === next) return;
    this.broadcasting = next;
    if (this.connection?.role !== "host") return;
    if (next) {
      this.eventTarget.addEventListener(this.presentation.stateChangeEvent, this.stateChangeHandler);
      void this.publishSnapshot();
    } else {
      clearTimeout(this.snapshotTimer);
      this.eventTarget.removeEventListener(this.presentation.stateChangeEvent, this.stateChangeHandler);
    }
  }

  async disconnect() {
    clearTimeout(this.snapshotTimer);
    this.eventTarget?.removeEventListener(this.presentation.stateChangeEvent, this.stateChangeHandler);
    const client = this.client;
    const channelName = this.connection?.channelName;
    this.connected = false;
    this.broadcasting = false;
    this.client = null;
    this.connection = null;
    if (!client) return;
    if (channelName) await client.unsubscribe(channelName).catch(() => {});
    await client.logout().catch(() => {});
    this.onStatus("disconnected");
  }
}
