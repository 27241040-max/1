import { TicketCategory, TicketStatus } from "core/email";
import { afterEach, describe, expect, test, vi } from "vitest";

import { shouldPollForTicketAutomation } from "./ticket-display";

describe("shouldPollForTicketAutomation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns true for recent uncategorized tickets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T10:00:30.000Z"));

    expect(
      shouldPollForTicketAutomation({
        category: null,
        createdAt: "2026-04-14T10:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      shouldPollForTicketAutomation({
        category: TicketCategory.general,
        createdAt: "2026-04-14T10:00:00.000Z",
        status: TicketStatus.processing,
      }),
    ).toBe(true);
  });

  test("returns false for categorized tickets or stale uncategorized tickets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T10:02:30.000Z"));

    expect(
      shouldPollForTicketAutomation({
        category: TicketCategory.technical,
        createdAt: "2026-04-14T10:02:00.000Z",
      }),
    ).toBe(false);
    expect(
      shouldPollForTicketAutomation({
        category: null,
        createdAt: "2026-04-14T10:00:00.000Z",
      }),
    ).toBe(false);
  });
});
