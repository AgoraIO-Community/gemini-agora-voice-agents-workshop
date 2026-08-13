import { describe, expect, it, vi } from "vitest";
import {
  AUDIENCE_USER_ID_KEY,
  createAudienceUserId,
  getOrCreateAudienceUserId,
  isAudienceUserId
} from "../src/identity.js";

const UUID = "12345678-1234-4abc-8def-123456789abc";

describe("audience signaling identity", () => {
  it("creates a restricted string UID", () => {
    const userId = createAudienceUserId(() => UUID);
    expect(userId).toBe("audience-1234567812344abc8def1234");
    expect(isAudienceUserId(userId)).toBe(true);
    expect(isAudienceUserId("host-2026-08-12")).toBe(false);
  });

  it("stores a new UID and reuses it on later page loads", () => {
    const values = new Map();
    const storage = {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => values.set(key, value))
    };
    const randomUUID = vi.fn(() => UUID);

    const first = getOrCreateAudienceUserId(storage, randomUUID);
    const second = getOrCreateAudienceUserId(storage, randomUUID);

    expect(first).toBe(second);
    expect(storage.setItem).toHaveBeenCalledWith(AUDIENCE_USER_ID_KEY, first);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("replaces malformed saved IDs and still works when storage is unavailable", () => {
    const blockedStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); }
    };
    expect(getOrCreateAudienceUserId(blockedStorage, () => UUID)).toBe("audience-1234567812344abc8def1234");
  });
});
